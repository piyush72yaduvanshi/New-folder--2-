'use strict';

const db = require("../../../src/config/db");
const Job = require("../models/Job");

class JobRepository {
  async findById(jobId) {
    const [rows] = await db.query(
      `SELECT j.*, v.model_name as vehicle_model, v.registration_number as vehicle_number
       FROM jobs j
       LEFT JOIN vehicles v ON j.assigned_vehicle_id = v.vehicle_id
       WHERE j.job_id = ?`,
      [jobId]
    );

    if (rows.length === 0) return null;
    return new Job(rows[0]);
  }

  async findAvailable() {
    const [rows] = await db.query(
      `SELECT j.*, v.model_name as vehicle_model, v.registration_number as vehicle_number
       FROM jobs j
       LEFT JOIN vehicles v ON j.assigned_vehicle_id = v.vehicle_id
       WHERE j.status IN ('AVAILABLE', 'PENDING')
         AND j.assigned_rider_id IS NULL
       ORDER BY j.created_at DESC`
    );

    return rows.map((r) => new Job(r));
  }

  async findByUserId(userId) {
    // Resolve rider_id from user_id if needed
    const [riderRows] = await db.query(
      'SELECT rider_id FROM riders WHERE user_id = ? LIMIT 1',
      [userId]
    );

    const riderId = riderRows.length > 0 ? riderRows[0].rider_id : null;

    const [rows] = await db.query(
      `SELECT j.*, v.model_name as vehicle_model, v.registration_number as vehicle_number
       FROM jobs j
       LEFT JOIN vehicles v ON j.assigned_vehicle_id = v.vehicle_id
       WHERE j.assigned_rider_id = ? OR j.assigned_rider_id = ?
       ORDER BY
         CASE
           WHEN j.status = 'IN_PROGRESS' THEN 1
           WHEN j.status = 'ASSIGNED' THEN 2
           WHEN j.status = 'COMPLETED' THEN 3
           ELSE 4
         END,
         j.created_at DESC`,
      [riderId, userId]
    );

    return rows.map((r) => new Job(r));
  }

  async acceptJob(jobId, userId) {
    // Resolve rider_id from user_id
    const [riderRows] = await db.query(
      'SELECT rider_id FROM riders WHERE user_id = ? LIMIT 1',
      [userId]
    );
    const riderId = riderRows.length > 0 ? riderRows[0].rider_id : userId;

    const [result] = await db.query(
      `UPDATE jobs
       SET status = 'ASSIGNED',
           assigned_rider_id = ?,
           updated_at = NOW()
       WHERE job_id = ?
         AND (status IN ('AVAILABLE', 'PENDING') OR status IS NULL)
         AND assigned_rider_id IS NULL`,
      [riderId, jobId]
    );

    return result.affectedRows > 0;
  }

  async completeJob(jobId, userId) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Resolve rider_id from user_id
      const [riderRows] = await connection.query(
        'SELECT rider_id FROM riders WHERE user_id = ? LIMIT 1',
        [userId]
      );
      const riderId = riderRows.length > 0 ? riderRows[0].rider_id : userId;

      const [jobRows] = await connection.query(
        `SELECT job_id, assigned_rider_id, status, distance_km
         FROM jobs
         WHERE job_id = ?
         FOR UPDATE`,
        [jobId]
      );

      if (jobRows.length === 0) {
        await connection.rollback();
        return false;
      }

      const job = jobRows[0];

      if (
        (Number(job.assigned_rider_id) !== Number(riderId) && Number(job.assigned_rider_id) !== Number(userId)) ||
        !['ASSIGNED', 'IN_PROGRESS'].includes(job.status)
      ) {
        await connection.rollback();
        return false;
      }

      await connection.query(
        `UPDATE jobs
         SET status = 'COMPLETED',
             updated_at = NOW()
         WHERE job_id = ?`,
        [jobId]
      );

      // Calculate earnings based on distance or base payout
      const earnings = Number(job.distance_km ? job.distance_km * 15 : 100);

      const [walletRows] = await connection.query(
        `SELECT wallet_id, wallet_amount, is_active
         FROM wallets WHERE user_id = ? LIMIT 1 FOR UPDATE`,
        [userId]
      );

      if (walletRows.length > 0 && walletRows[0].is_active) {
        const wallet = walletRows[0];
        const openingBalance = Number(wallet.wallet_amount || 0);
        const closingBalance = openingBalance + earnings;
        const referenceId = `JOB-EARNING-${jobId}-${Date.now()}`;

        await connection.query(
          `UPDATE wallets SET wallet_amount = ?, updated_at = NOW() WHERE wallet_id = ?`,
          [closingBalance, wallet.wallet_id]
        );

        await connection.query(
          `INSERT INTO wallet_transactions
          (wallet_id, user_id, type, source, status, amount,
           opening_balance, closing_balance, reference_id, note, created_at)
          VALUES (?, ?, 'credit', 'earning', 'success', ?, ?, ?, ?, ?, NOW())`,
          [wallet.wallet_id, userId, earnings, openingBalance, closingBalance,
           referenceId, `Job earnings credited for job #${jobId}`]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new JobRepository();
