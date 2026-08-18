/**
 * invoiceController.js
 *
 * GET /api/bookings/:id/invoice
 *
 * Generates and streams a PDF invoice for a completed / active booking.
 * Uses pdfkit — no temp file written, streamed directly to response.
 */

const logger = require("../../../src/utils/logger");
const PDFDocument = require("pdfkit");
const db = require("../../../src/config/db");

exports.downloadInvoice = async (req, res) => {
  try {
    const bookingId = Number(req.params.id);
    const loggedInUserId = Number(req.user.id);
    const userRole = req.user.role;

    if (!Number.isInteger(bookingId)) {
      return res.status(400).json({ success: false, message: "Valid booking id is required" });
    }

    // Fetch booking with vehicle and user details
    const [rows] = await db.query(
      `SELECT
         b.booking_id, b.reference_id, b.user_id, b.vehicle_id,
         b.start_date, b.end_date,
         b.rental_rate_per_week, b.total_amount, b.security_deposit,
         b.status, b.payment_status, b.coupon_code,
         b.created_at,
         u.full_name, u.phone AS phone_number, u.email,
         v.model_name, v.registration_number
       FROM bookings b
       JOIN users    u ON u.user_id    = b.user_id
       JOIN vehicles v ON v.vehicle_id = b.vehicle_id
       WHERE b.booking_id = ?
       LIMIT 1`,
      [bookingId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const bk = rows[0];

    // Authorization — owner or admin only
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(String(userRole).toUpperCase());
    if (!isAdmin && Number(bk.user_id) !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: "You can only download your own invoice",
      });
    }

    // Fetch coupon discount if applied
    let discountAmount = 0;
    if (bk.coupon_code) {
      const [couponRows] = await db.query(
        `SELECT cu.discount_amount
         FROM coupon_usages cu
         JOIN coupons c ON c.coupon_id = cu.coupon_id
         WHERE c.code = ? AND cu.booking_id = ?
         LIMIT 1`,
        [bk.coupon_code, bookingId]
      );
      if (couponRows.length) {
        discountAmount = Number(couponRows[0].discount_amount || 0);
      }
    }

    // ── Build PDF ────────────────────────────────────────────────────────────
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Pravazo_Invoice_${bk.reference_id || bookingId}.pdf"`
    );

    doc.pipe(res);

    const GREEN = "#22c55e";
    const DARK  = "#0a0a0a";
    const GRAY  = "#6b7280";

    // Header bar
    doc.rect(0, 0, doc.page.width, 80).fill(DARK);
    doc
      .fontSize(24)
      .fillColor(GREEN)
      .font("Helvetica-Bold")
      .text("PRAVAZO", 50, 25, { continued: true })
      .fillColor("white")
      .fontSize(10)
      .font("Helvetica")
      .text("  EV Rental & Delivery Platform", { baseline: "bottom" });

    doc
      .fontSize(9)
      .fillColor("#9ca3af")
      .text("pravazo.com  |  support@pravazo.com", 50, 55);

    // Invoice title
    doc
      .moveDown(3)
      .fontSize(18)
      .fillColor(DARK)
      .font("Helvetica-Bold")
      .text("TAX INVOICE", { align: "center" });

    doc.moveDown(0.5);

    // Two-column header info
    const infoTop = doc.y;
    const col2 = 320;

    doc.fontSize(9).font("Helvetica").fillColor(GRAY);

    // Left column
    const leftLines = [
      ["Invoice No", bk.reference_id || `PRV-${bookingId}`],
      ["Booking ID", `#${bookingId}`],
      ["Invoice Date", new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
      ["Booking Status", bk.status],
      ["Payment Status", bk.payment_status],
    ];

    leftLines.forEach(([label, value], i) => {
      const y = infoTop + i * 18;
      doc.fillColor(GRAY).text(`${label}:`, 50, y, { width: 90 });
      doc.fillColor(DARK).font("Helvetica-Bold").text(value || "-", 145, y);
      doc.font("Helvetica");
    });

    // Right column — Billed To
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10).text("Billed To:", col2, infoTop);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(DARK)
      .text(bk.full_name || "-", col2, infoTop + 16)
      .fillColor(GRAY)
      .text(bk.phone_number || "-", col2, infoTop + 30)
      .text(bk.email || "-", col2, infoTop + 44);

    doc.moveDown(5);

    // Divider
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .strokeColor("#e5e7eb")
      .lineWidth(1)
      .stroke();
    doc.moveDown(0.8);

    // Vehicle section
    doc
      .fontSize(10)
      .fillColor(DARK)
      .font("Helvetica-Bold")
      .text("Vehicle Details");
    doc.moveDown(0.4);

    const vehicleLines = [
      ["Model", bk.model_name || "-"],
      ["Registration No", bk.registration_number || "-"],
      ["Rental Period", `${fmtDate(bk.start_date)}  →  ${fmtDate(bk.end_date)}`],
    ];

    vehicleLines.forEach(([label, value]) => {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(GRAY)
        .text(`${label}:`, 50, doc.y, { continued: true, width: 120 })
        .fillColor(DARK)
        .text(`  ${value}`);
    });

    doc.moveDown(1.2);

    // ── Price Table ──────────────────────────────────────────────────────────
    const tableTop = doc.y;
    const colX = [50, 300, 430];
    const rowH = 24;

    // Table header
    doc
      .rect(50, tableTop, doc.page.width - 100, rowH)
      .fill(DARK);

    ["Description", "Details", "Amount (₹)"].forEach((h, i) => {
      doc
        .fillColor("white")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(h, colX[i], tableTop + 7, { width: 120 });
    });

    const tableRows = [
      ["Rental Charges", `${bk.rental_rate_per_week}/week`, rupee(bk.rental_rate_per_week)],
      ["Security Deposit", "Refundable", rupee(bk.security_deposit)],
    ];

    if (discountAmount > 0) {
      tableRows.push([`Coupon (${bk.coupon_code})`, "Discount Applied", `- ${rupee(discountAmount)}`]);
    }

    tableRows.forEach((row, idx) => {
      const y = tableTop + rowH + idx * rowH;
      const bg = idx % 2 === 0 ? "#f9fafb" : "white";
      doc.rect(50, y, doc.page.width - 100, rowH).fill(bg);

      row.forEach((cell, ci) => {
        doc
          .fillColor(ci === 2 && cell.startsWith("-") ? "#ef4444" : DARK)
          .font(ci === 2 ? "Helvetica-Bold" : "Helvetica")
          .fontSize(9)
          .text(cell, colX[ci], y + 7, { width: 120 });
      });
    });

    // Total row
    const totalY = tableTop + rowH + tableRows.length * rowH;
    doc
      .rect(50, totalY, doc.page.width - 100, rowH + 4)
      .fill(GREEN);

    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Total Amount Paid", colX[0], totalY + 7)
      .text(rupee(bk.total_amount), colX[2], totalY + 7, { width: 120 });

    doc.moveDown(8);

    // Footer
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .strokeColor("#e5e7eb")
      .stroke();

    doc
      .moveDown(0.6)
      .fontSize(8)
      .fillColor(GRAY)
      .font("Helvetica")
      .text(
        "This is a computer-generated invoice and does not require a signature. " +
          "For queries, contact support@pravazo.com",
        50,
        doc.y,
        { align: "center", width: doc.page.width - 100 }
      );

    doc.end();
  } catch (error) {
    logger.error("Invoice PDF Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ── utils ──────────────────────────────────────────────────────────────────────

function rupee(amount) {
  return `₹${Number(amount || 0).toFixed(2)}`;
}

function fmtDate(dateVal) {
  if (!dateVal) return "-";
  return new Date(dateVal).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
