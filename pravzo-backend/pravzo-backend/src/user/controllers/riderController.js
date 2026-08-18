const logger = require("../../../src/utils/logger");
const UserRepository = require("../repositories/UserRepository");
const { deleteCache } = require("../services/cacheService");
const db = require("../../../src/config/db");

// ─── APPLY AS RIDER ──────────────────────────────────────────
// POST /api/riders/apply
// Authenticated — role: USER / ADMIN / SUPER_ADMIN

exports.applyRider = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const payload = {
      selected_partner: req.body.selected_partner ?? null,
      rider_code: req.body.rider_code ?? null,
      driving_license_number: req.body.driving_license_number ?? null,
      driving_license_photo: req.body.driving_license_photo ?? null,
      driving_license_back_photo: req.body.driving_license_back_photo ?? null,
      aadhar_number: req.body.aadhar_number ?? null,
      aadhar_card_photo: req.body.aadhar_card_photo ?? null,
      aadhar_card_back_photo: req.body.aadhar_card_back_photo ?? null,
      profile_photo: req.body.profile_photo ?? null,
      bank_account_number: req.body.bank_account_number ?? null,
      ifsc_code: req.body.ifsc_code ?? null,
      branch_name: req.body.branch_name ?? null,
      account_holder_name: req.body.account_holder_name ?? null,
      upi_id: req.body.upi_id ?? null,
      payout_schedule: req.body.payout_schedule ?? null,
      emergency_contact_name: req.body.emergency_contact_name ?? null,
      emergency_contact_number: req.body.emergency_contact_number ?? null,
      application_status: "pending",
      employee_status: "inactive",
    };

    const success = await UserRepository.applyRider(userId, payload);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await deleteCache(`user_profile:${userId}`);

    return res.status(200).json({
      success: true,
      message: "Rider application submitted successfully",
    });
  } catch (error) {
    logger.error("Apply Rider Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit rider application",
    });
  }
};

// ─── ADMIN: VERIFY / REJECT RIDER ───────────────────────────
// PUT /api/admin/riders/:userId/verify
// Authenticated — role: ADMIN / SUPER_ADMIN

exports.verifyRider = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const application_status = String(
      req.body.application_status || ""
    ).toLowerCase();
    const employee_status = req.body.employee_status ?? null;

    if (!["verified", "rejected", "pending"].includes(application_status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid application_status. Allowed values: verified | rejected | pending",
      });
    }

    // When verifying, employee_status should be set
    let resolvedEmployeeStatus = employee_status;
    if (application_status === "verified" && !resolvedEmployeeStatus) {
      resolvedEmployeeStatus = "ACTIVE";
    }
    if (application_status === "rejected") {
      resolvedEmployeeStatus = "INACTIVE";
    }

    const success = await UserRepository.verifyRider(userId, {
      application_status,
      employee_status: resolvedEmployeeStatus,
    });

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await deleteCache(`user_profile:${userId}`);

    return res.status(200).json({
      success: true,
      message: `Rider application ${application_status} successfully`,
    });
  } catch (error) {
    logger.error("Verify Rider Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify rider",
    });
  }
};

// ─── GET APPLICATION STATUS ──────────────────────────────────
// GET /api/riders/:id/application-status

exports.getApplicationStatus = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const user = await UserRepository.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        application_status: user.application_status || null,
        employee_status: user.employee_status || null,
      },
    });
  } catch (error) {
    logger.error("Get Application Status Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch application status",
    });
  }
};

// ─── GET RIDER PROFILE ───────────────────────────────────────

exports.getMyRiderProfile = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const user = await UserRepository.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user.toSelfProfileResponse(),
    });
  } catch (error) {
    logger.error("Get Rider Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch rider profile",
    });
  }
};

// ─── UPLOAD / VERIFY ID DOCUMENTS (Aadhaar, DL) ────────────
// POST /api/riders/verify-id

exports.verifyRiderId = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const document_type = req.body.document_type || req.body.type;
    const document_number = req.body.document_number || req.body.aadhar_number || req.body.driving_license_number;
    const front_image_url = req.body.front_image_url || req.body.aadhar_card_photo || req.body.driving_license_photo;
    const back_image_url = req.body.back_image_url || req.body.aadhar_card_back_photo || req.body.driving_license_back_photo;

    if (!document_type) {
      return res.status(400).json({
        success: false,
        message: "type is required (aadhaar | licence)",
      });
    }

    const typeLower = String(document_type).toLowerCase();
    if (!["aadhaar", "driving_license", "aadhar", "licence"].includes(typeLower)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document_type. Allowed: aadhaar | licence",
      });
    }

    const updates = {};
    if (typeLower === "aadhaar" || typeLower === "aadhar") {
      if (document_number) {
        const cleanAadhaar = String(document_number).replace(/\s/g, "");
        if (!/^\d{12}$/.test(cleanAadhaar)) {
          return res.status(400).json({
            success: false,
            message: "Aadhaar number must be a 12-digit number",
          });
        }
        updates.aadhar_number = cleanAadhaar;
      }

      if (!front_image_url) {
        return res.status(400).json({
          success: false,
          message: "Front image (aadhar_card_photo) is required for Aadhaar verification",
        });
      }

      updates.aadhar_card_photo = front_image_url;
      if (back_image_url) updates.aadhar_card_back_photo = back_image_url;
    } else if (typeLower === "driving_license" || typeLower === "licence") {
      if (document_number) updates.driving_license_number = document_number;
      if (front_image_url) updates.driving_license_photo = front_image_url;
      if (back_image_url) updates.driving_license_back_photo = back_image_url;
    }

    const success = await UserRepository.update(userId, updates);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "User not found or no fields updated",
      });
    }

    const docType = (typeLower === "aadhaar" || typeLower === "aadhar") ? "AADHAR" : "DL";
    const docNum = updates.aadhar_number || updates.driving_license_number || null;
    const frontUrl = updates.aadhar_card_photo || updates.driving_license_photo || front_image_url;
    const backUrl = updates.aadhar_card_back_photo || updates.driving_license_back_photo || back_image_url || null;

    await db.query(
      `INSERT INTO user_documents (user_id, document_type, document_number, file_url, file_url_back, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())`,
      [userId, docType, docNum, frontUrl, backUrl]
    ).catch(() => {});

    await db.query(
      `INSERT INTO kyc (user_id, kyc_type, status, created_at, updated_at)
       VALUES (?, 'STANDARD', 'PENDING', NOW(), NOW())
       ON DUPLICATE KEY UPDATE status = 'PENDING', updated_at = NOW()`,
      [userId]
    ).catch(() => {});

    await deleteCache(`user_profile:${userId}`);

    return res.status(200).json({
      success: true,
      message: `${document_type} verification pending`,
    });
  } catch (error) {
    logger.error("Verify ID Document Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify ID document",
    });
  }
};

// ─── VERIFY RIDER CODE ───────────────────────────────────────
// POST /api/riders/verify-code

exports.verifyRiderCode = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { rider_code } = req.body;

    if (!rider_code) {
      return res.status(400).json({
        success: false,
        message: "rider_code is required",
      });
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.rider_code) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "No rider code assigned to this user",
      });
    }

    if (user.rider_code !== rider_code) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Invalid rider code",
      });
    }

    if (user.application_status !== "verified" && user.application_status !== "approved") {
      return res.status(403).json({
        success: false,
        verified: false,
        message: "Rider application is not verified yet",
      });
    }

    await UserRepository.update(userId, {
      role: "VEHICLE_WITH_JOB",
      employee_status: "ACTIVE",
    });

    await deleteCache(`user_profile:${userId}`);

    const updatedUser = await UserRepository.findById(userId);

    return res.status(200).json({
      success: true,
      verified: true,
      message: "Rider code verified successfully. Role upgraded to VEHICLE_WITH_JOB",
      data: updatedUser ? updatedUser.toSelfProfileResponse() : { role: "VEHICLE_WITH_JOB" },
    });
  } catch (error) {
    logger.error("Verify Rider Code Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify rider code",
    });
  }
};
