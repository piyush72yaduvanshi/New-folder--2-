/*
 * couponController.js

 */

const logger = require("../../../src/utils/logger");
const db = require("../../../src/config/db");

// ─── helpers ──────────────────────────────────────────────────────────────────

function calcDiscount(coupon, bookingAmount) {
  let discountAmount = 0;

  if (coupon.discount_type === "PERCENT") {
    discountAmount = (Number(bookingAmount) * Number(coupon.discount_value)) / 100;
    if (coupon.max_discount_amount && discountAmount > Number(coupon.max_discount_amount)) {
      discountAmount = Number(coupon.max_discount_amount);
    }
  } else {
    // FLAT
    discountAmount = Number(coupon.discount_value);
  }

  discountAmount = Math.min(discountAmount, Number(bookingAmount));
  return Number(discountAmount.toFixed(2));
}

async function findActiveCoupon(code) {
  const [rows] = await db.query(
    `SELECT *
     FROM coupons
     WHERE code = ?
       AND is_active = 1
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND (valid_until IS NULL OR valid_until >= NOW())
     LIMIT 1`,
    [String(code).trim().toUpperCase()]
  );
  return rows[0] || null;
}

async function usageCountForUser(couponId, userId) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt
     FROM coupon_usages
     WHERE coupon_id = ? AND user_id = ?`,
    [couponId, userId]
  );
  return Number(rows[0].cnt);
}

async function totalUsageCount(couponId) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS cnt FROM coupon_usages WHERE coupon_id = ?`,
    [couponId]
  );
  return Number(rows[0].cnt);
}

// ─── VALIDATE (no side effects) ───────────────────────────────────────────────
// POST /api/coupons/validate
// Body: { code, booking_amount }

exports.validateCoupon = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { code, booking_amount } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "code is required" });
    }

    const amount = Number(booking_amount) || 0;

    const coupon = await findActiveCoupon(code);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: "Invalid or expired coupon code",
      });
    }

    // Min order check
    if (coupon.min_order_amount && amount < Number(coupon.min_order_amount)) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: `Minimum booking amount of ₹${coupon.min_order_amount} required for this coupon`,
      });
    }

    // Per-user usage limit
    if (coupon.max_uses_per_user) {
      const used = await usageCountForUser(coupon.coupon_id, userId);
      if (used >= Number(coupon.max_uses_per_user)) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: "You have already used this coupon the maximum number of times",
        });
      }
    }

    // Total usage limit
    if (coupon.max_total_uses) {
      const total = await totalUsageCount(coupon.coupon_id);
      if (total >= Number(coupon.max_total_uses)) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: "This coupon has been fully redeemed",
        });
      }
    }

    const discountAmount = calcDiscount(coupon, amount);
    const finalAmount = Number((amount - discountAmount).toFixed(2));

    return res.status(200).json({
      success: true,
      valid: true,
      message: `Coupon applied! You save ₹${discountAmount}`,
      data: {
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount,
        original_amount: amount,
        final_amount: finalAmount,
      },
    });
  } catch (error) {
    logger.error("Validate Coupon Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── APPLY (records usage against booking) ────────────────────────────────────
// POST /api/coupons/apply
// Body: { code, booking_id, booking_amount }

exports.applyCoupon = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const userId = Number(req.user.id);
    const { code, booking_id, booking_amount } = req.body;

    if (!code || !booking_id) {
      return res.status(400).json({
        success: false,
        message: "code and booking_id are required",
      });
    }

    const amount = Number(booking_amount) || 0;

    await connection.beginTransaction();

    const [couponRows] = await connection.query(
      `SELECT *
       FROM coupons
       WHERE code = ?
         AND is_active = 1
         AND (valid_from IS NULL OR valid_from <= NOW())
         AND (valid_until IS NULL OR valid_until >= NOW())
       LIMIT 1
       FOR UPDATE`,
      [String(code).trim().toUpperCase()]
    );

    const coupon = couponRows[0];
    if (!coupon) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        valid: false,
        message: "Invalid or expired coupon code",
      });
    }

    if (coupon.min_order_amount && amount < Number(coupon.min_order_amount)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Minimum booking amount of ₹${coupon.min_order_amount} required`,
      });
    }

    if (coupon.max_uses_per_user) {
      const [usageRows] = await connection.query(
        `SELECT COUNT(*) AS cnt FROM coupon_usages WHERE coupon_id = ? AND user_id = ?`,
        [coupon.coupon_id, userId]
      );
      if (Number(usageRows[0].cnt) >= Number(coupon.max_uses_per_user)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "You have already used this coupon the maximum number of times",
        });
      }
    }

    if (coupon.max_total_uses) {
      const [totalRows] = await connection.query(
        `SELECT COUNT(*) AS cnt FROM coupon_usages WHERE coupon_id = ?`,
        [coupon.coupon_id]
      );
      if (Number(totalRows[0].cnt) >= Number(coupon.max_total_uses)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "This coupon has been fully redeemed",
        });
      }
    }

    // Check if already applied to this booking
    const [existingRows] = await connection.query(
      `SELECT usage_id FROM coupon_usages WHERE coupon_id = ? AND booking_id = ?`,
      [coupon.coupon_id, booking_id]
    );
    if (existingRows.length) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: "A coupon has already been applied to this booking",
      });
    }

    const discountAmount = calcDiscount(coupon, amount);
    const finalAmount = Number((amount - discountAmount).toFixed(2));

    // Record usage
    await connection.query(
      `INSERT INTO coupon_usages (coupon_id, user_id, booking_id, discount_amount, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [coupon.coupon_id, userId, booking_id, discountAmount]
    );

    // Update booking total_amount
    await connection.query(
      `UPDATE bookings SET total_amount = ?, coupon_code = ?, updated_at = NOW() WHERE booking_id = ?`,
      [finalAmount, coupon.code, booking_id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Coupon applied! You saved ₹${discountAmount}`,
      data: {
        code: coupon.code,
        discount_amount: discountAmount,
        original_amount: amount,
        final_amount: finalAmount,
      },
    });
  } catch (error) {
    await connection.rollback();
    logger.error("Apply Coupon Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// ─── ADMIN: LIST COUPONS ──────────────────────────────────────────────────────

exports.listCoupons = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM coupon_usages cu WHERE cu.coupon_id = c.coupon_id) AS total_used
       FROM coupons c
       ORDER BY c.created_at DESC`
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    logger.error("List Coupons Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: CREATE COUPON ─────────────────────────────────────────────────────
// Body: { code, description, discount_type, discount_value, max_discount_amount,
//         min_order_amount, max_uses_per_user, max_total_uses, valid_from, valid_until }

exports.createCoupon = async (req, res) => {
  try {
    const {
      code, description, discount_type, discount_value,
      max_discount_amount, min_order_amount,
      max_uses_per_user, max_total_uses,
      valid_from, valid_until,
    } = req.body;

    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({
        success: false,
        message: "code, discount_type, and discount_value are required",
      });
    }

    if (!["PERCENT", "FLAT"].includes(String(discount_type).toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "discount_type must be PERCENT or FLAT",
      });
    }

    const cleanCode = String(code).trim().toUpperCase();

    const [existing] = await db.query(
      `SELECT coupon_id FROM coupons WHERE code = ? LIMIT 1`,
      [cleanCode]
    );
    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: `Coupon code '${cleanCode}' already exists`,
      });
    }

    const [result] = await db.query(
      `INSERT INTO coupons
       (code, description, discount_type, discount_value, max_discount_amount,
        min_order_amount, max_uses_per_user, max_total_uses,
        valid_from, valid_until, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [
        cleanCode,
        description || null,
        String(discount_type).toUpperCase(),
        Number(discount_value),
        max_discount_amount ? Number(max_discount_amount) : null,
        min_order_amount ? Number(min_order_amount) : null,
        max_uses_per_user ? Number(max_uses_per_user) : null,
        max_total_uses ? Number(max_total_uses) : null,
        valid_from || null,
        valid_until || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: { coupon_id: result.insertId, code: cleanCode },
    });
  } catch (error) {
    logger.error("Create Coupon Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: TOGGLE COUPON STATUS ──────────────────────────────────────────────
// PUT /api/coupons/:code
// Body: { is_active: true/false }

exports.toggleCoupon = async (req, res) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();
    const isActive = req.body.is_active === true || req.body.is_active === 1 ? 1 : 0;

    const [result] = await db.query(
      `UPDATE coupons SET is_active = ?, updated_at = NOW() WHERE code = ?`,
      [isActive, code]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Coupon ${isActive ? "enabled" : "disabled"} successfully`,
    });
  } catch (error) {
    logger.error("Toggle Coupon Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ADMIN: DELETE COUPON ─────────────────────────────────────────────────────
// DELETE /api/coupons/:code — soft deletes by setting is_active = 0

exports.deleteCoupon = async (req, res) => {
  try {
    const code = String(req.params.code).trim().toUpperCase();

    const [result] = await db.query(
      `UPDATE coupons SET is_active = 0, updated_at = NOW() WHERE code = ?`,
      [code]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Coupon '${code}' deleted successfully`,
    });
  } catch (error) {
    logger.error("Delete Coupon Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
