const express = require("express");
const router = express.Router();

const roleController = require("../controllers/roleController");
const authMiddleware = require("../middleware/authMiddleware");
const ownerMiddleware = require("../middleware/ownerMiddleware");

// POST /api/users/:id/change-role
// Body: { role: "USER" | "VEHICLE" | "VEHICLE_WITH_JOB" }
router.post(
  "/:id/change-role",
  authMiddleware,
  ownerMiddleware("id"),
  roleController.changeRole
);

module.exports = router;
