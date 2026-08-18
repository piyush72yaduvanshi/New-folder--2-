/**
 * performanceController.js
 *
 * GET /api/performance/:userId?period=today|week|month|quarter
 *
 * Returns real analytics from the database:
 *   - Total deliveries (jobs completed)
 *   - Active hours (placeholder — extend when GPS logs are added)
 *   - Total earnings (wallet CREDIT transactions from bookings/jobs)
 *   - Completion rate, cancellation rate
 *   - Daily earnings trend (last 7 days)
 *   - Payout summary
 */

const logger = require("../../../src/utils/logger");
const db = require("../../../src/config/db");

// ── period helpers ─────────────────────────────────────────────────────────────

function getDateRange(period) {
  const now = new Date();
  let from;

  switch (period) {
    case "today":
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "month":
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      from = new Date(now.getFullYear(), q * 3, 1);
      break;
    }
    case "week":
    default: {
      const day = now.getDay(); // 0=Sun
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      from = new Date(now.getFullYear(), now.getMonth(), diff);
    }
  }

  return {
    from: toMySQLDate(from),
    to: toMySQLDate(now),
  };
}

function toMySQLDate(d) {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// ────────────────────────────────────────────────────────────────────────────

exports.getRiderPerformance = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const loggedInId = Number(req.user.id);
    const role = req.user.role;

    // Only own data or admin
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(String(role).toUpperCase());
    if (!isAdmin && userId !== loggedInId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own performance",
      });
    }

    const period = ["today", "week", "month", "quarter"].includes(req.query.period)
      ? req.query.period
      : "week";

    const { from, to } = getDateRange(period);

    // ── 1. Jobs in period ────────────────────────────────────────────────────
    const [jobRows] = await db.query(
      `SELECT
         COUNT(*)                                          AS total_jobs,
         SUM(status = 'COMPLETED')                        AS completed_jobs,
         SUM(status = 'CANCELLED')                        AS cancelled_jobs,
         SUM(status = 'ASSIGNED' OR status = 'IN_PROGRESS') AS in_progress_jobs
       FROM jobs
       WHERE (assigned_rider_id = ? OR assigned_rider_id = (SELECT rider_id FROM riders WHERE user_id = ? LIMIT 1))
         AND created_at BETWEEN ? AND ?`,
      [userId, userId, from, to]
    );

    const jobs = jobRows[0];
    const totalJobs = Number(jobs.total_jobs || 0);
    const completedJobs = Number(jobs.completed_jobs || 0);
    const cancelledJobs = Number(jobs.cancelled_jobs || 0);
    const inProgressJobs = Number(jobs.in_progress_jobs || 0);

    const completionRate =
      totalJobs > 0 ? ((completedJobs / totalJobs) * 100).toFixed(1) : "0.0";
    const cancellationRate =
      totalJobs > 0 ? ((cancelledJobs / totalJobs) * 100).toFixed(1) : "0.0";

    // ── 2. Earnings from wallet transactions ─────────────────────────────────
    const [earnRows] = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='CREDIT' AND source IN ('booking','job_earning') THEN amount ELSE 0 END), 0) AS total_earnings,
         COALESCE(SUM(CASE WHEN type='DEBIT'  AND source = 'instant_cashout'          THEN amount ELSE 0 END), 0) AS total_cashout
       FROM wallet_transactions
       WHERE user_id = ?
         AND created_at BETWEEN ? AND ?`,
      [userId, from, to]
    );

    const totalEarnings = Number(earnRows[0].total_earnings || 0);
    const totalCashout = Number(earnRows[0].total_cashout || 0);

    // ── 3. Daily earnings trend (last 7 days always) ─────────────────────────
    const [trendRows] = await db.query(
      `SELECT
         DATE(created_at)  AS day,
         SUM(amount)       AS earned
       FROM wallet_transactions
       WHERE user_id = ?
         AND type = 'CREDIT'
         AND source IN ('booking', 'job_earning')
         AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY day ASC`,
      [userId]
    );

    // Fill missing days with 0
    const trendMap = {};
    trendRows.forEach(r => {
      trendMap[r.day.toISOString().slice(0, 10)] = Number(r.earned || 0);
    });

    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trend.push({
        date: key,
        label: d.toLocaleDateString("en-IN", { weekday: "short" }),
        earnings: trendMap[key] || 0,
      });
    }

    // ── 4. Payout summary ─────────────────────────────────────────────────────
    const [payoutRows] = await db.query(
      `SELECT
         COUNT(*)                                     AS total_payouts,
         COALESCE(SUM(amount), 0)                     AS total_paid_out,
         MAX(created_at)                              AS last_payout_date
       FROM payouts
       WHERE user_id = ? AND status = 'processed'`,
      [userId]
    );

    const payouts = payoutRows[0];

    // ── 5. All-time totals ────────────────────────────────────────────────────
    const [allTimeRows] = await db.query(
      `SELECT
         COUNT(*)                                          AS total_all,
         SUM(status = 'COMPLETED')                        AS completed_all
       FROM jobs WHERE (assigned_rider_id = ? OR assigned_rider_id = (SELECT rider_id FROM riders WHERE user_id = ? LIMIT 1))`,
      [userId, userId]
    );

    const allTime = allTimeRows[0];

    // ── 6. Wallet balance ─────────────────────────────────────────────────────
    const [walletRows] = await db.query(
      `SELECT wallet_balance FROM wallets WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    const walletBalance = Number(walletRows[0]?.wallet_balance || 0);

    return res.status(200).json({
      success: true,
      data: {
        period,
        date_range: { from, to },

        // Deliveries
        deliveries: {
          total: totalJobs,
          completed: completedJobs,
          cancelled: cancelledJobs,
          in_progress: inProgressJobs,
          completion_rate: `${completionRate}%`,
          cancellation_rate: `${cancellationRate}%`,
        },

        // Earnings
        earnings: {
          period_total: totalEarnings,
          period_cashout: totalCashout,
          wallet_balance: walletBalance,
          daily_trend: trend,
        },

        // Payouts
        payouts: {
          total_count: Number(payouts.total_payouts || 0),
          total_amount: Number(payouts.total_paid_out || 0),
          last_payout_date: payouts.last_payout_date || null,
        },

        // All-time
        all_time: {
          total_jobs: Number(allTime.total_all || 0),
          completed_jobs: Number(allTime.completed_all || 0),
        },
      },
    });
  } catch (error) {
    logger.error("Rider Performance Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
