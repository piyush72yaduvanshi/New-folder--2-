const express = require("express");
const router = express.Router();

const jobController = require("../controllers/jobController");
const authMiddleware = require("../middleware/authMiddleware");
const ownerMiddleware = require("../middleware/ownerMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

// ── STATIC ROUTES (MUST be before /:jobId) ───────────────────────────────────

router.get(
  "/available",
  authMiddleware,
  authorizeRoles("VEHICLE_WITH_JOB", "ADMIN", "SUPER_ADMIN"),
  jobController.getAvailableJobs,
);

router.get(
  "/user/:userId",
  authMiddleware,
  ownerMiddleware("userId"),
  authorizeRoles("VEHICLE_WITH_JOB", "ADMIN", "SUPER_ADMIN"),
  jobController.getUserJobs,
);

// ── PARAMETERIZED ROUTES (:jobId) ─────────────────────────────────────────────

// Get single job by ID
router.get(
  "/:jobId",
  authMiddleware,
  authorizeRoles("VEHICLE_WITH_JOB", "ADMIN", "SUPER_ADMIN"),
  jobController.getJobById,
);

router.post(
  "/:jobId/accept",
  authMiddleware,
  authorizeRoles("VEHICLE_WITH_JOB", "ADMIN", "SUPER_ADMIN"),
  jobController.acceptJob,
);

router.put(
  "/:jobId/complete",
  authMiddleware,
  authorizeRoles("VEHICLE_WITH_JOB", "ADMIN", "SUPER_ADMIN"),
  jobController.completeJob,
);

// Reject a job
router.post(
  "/:jobId/reject",
  authMiddleware,
  authorizeRoles("VEHICLE_WITH_JOB", "ADMIN", "SUPER_ADMIN"),
  jobController.rejectJob,
);

module.exports = router;