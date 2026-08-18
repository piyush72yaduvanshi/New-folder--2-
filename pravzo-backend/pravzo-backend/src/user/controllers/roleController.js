/**
 * roleController.js
 *
 * Handles post-signup role change.
 *
 * User → RENT_A_VEHICLE  : instant (just update DB)
 * User → VEHICLE_WITH_JOB: requires completed rider application
 *                          (application_status = 'verified')
 */

const logger = require("../../../src/utils/logger");
const UserRepository = require("../repositories/UserRepository");
const { deleteCache, deleteByPattern } = require("../services/cacheService");
const db = require("../../../src/config/db");

const ALLOWED_SELF_ROLES = ["USER", "RENT_A_VEHICLE"];
// VEHICLE_WITH_JOB is granted only after admin verification — not directly

exports.changeRole = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "role is required",
      });
    }

    const normalizedRole = String(role).trim().toUpperCase();

    // Map frontend role names to DB enum values
    const roleMap = {
      USER: "CUSTOMER",
      CUSTOMER: "CUSTOMER",
      VEHICLE: "CUSTOMER",
      RENT_A_VEHICLE: "CUSTOMER",
      RIDER: "RIDER",
      VEHICLEWITHJOB: "RIDER",
      VEHICLE_WITH_JOB: "RIDER",
    };

    const dbRole = roleMap[normalizedRole];

    if (!dbRole) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role. Allowed values: USER / CUSTOMER (rent only) | RIDER / VEHICLE_WITH_JOB (requires rider verification)",
      });
    }

    // RIDER / VEHICLE_WITH_JOB can only be granted after admin approves application
    if (dbRole === "RIDER") {
      const user = await UserRepository.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (user.application_status !== "verified") {
        return res.status(403).json({
          success: false,
          message:
            "Your rider application must be verified by admin before switching to Rider role. Current status: " +
            (user.application_status || "not applied"),
        });
      }
    }

    await UserRepository.update(userId, { role: dbRole });

    await deleteCache(`user_profile:${userId}`);
    await deleteByPattern(`user_dashboard:${userId}:*`);

    const updatedUser = await UserRepository.findById(userId);

    return res.status(200).json({
      success: true,
      message: `Role changed to ${dbRole} successfully`,
      data: {
        user_id: userId,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    logger.error("Change Role Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to change role",
    });
  }
};
