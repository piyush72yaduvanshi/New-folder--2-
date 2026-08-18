const express = require("express");
const router = express.Router();

const riderController = require("../controllers/riderController");
const authMiddleware = require("../middleware/authMiddleware");
const ownerMiddleware = require("../middleware/ownerMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");
const { upload, processCloudUploads } = require("../../../src/middleware/uploadMiddleware");

router.post(
  "/apply",
  authMiddleware,
  authorizeRoles("USER", "ADMIN", "SUPER_ADMIN"),
  upload.any(),
  processCloudUploads(),
  riderController.applyRider,
);

router.get(
  "/:id/application-status",
  authMiddleware,
  ownerMiddleware("id"),
  riderController.getApplicationStatus,
);

router.post(
  "/verify-id",
  authMiddleware,
  authorizeRoles("USER", "VEHICLE_WITH_JOB", "ADMIN", "SUPER_ADMIN"),
  riderController.verifyRiderId,
);

// POST /api/riders/verify-code — verifies rider code and upgrades role
router.post(
  "/verify-code",
  authMiddleware,
  authorizeRoles("USER", "RENT_A_VEHICLE", "VEHICLE_WITH_JOB", "ADMIN", "SUPER_ADMIN"),
  riderController.verifyRiderCode,
);

module.exports = router;