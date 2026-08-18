const express = require("express");
const router = express.Router();

const performanceController = require("../controllers/performanceController");
const authMiddleware = require("../middleware/authMiddleware");
const ownerMiddleware = require("../middleware/ownerMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

// GET /api/performance/:userId?period=today|week|month|quarter
router.get(
  "/:userId",
  authMiddleware,
  ownerMiddleware("userId"),
  authorizeRoles("VEHICLE_WITH_JOB", "ADMIN", "SUPER_ADMIN"),
  performanceController.getRiderPerformance
);

module.exports = router;
