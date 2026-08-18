const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");
const ownerMiddleware = require("../middleware/ownerMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

router.get(
  "/:userId",
  authMiddleware,
  ownerMiddleware("userId"),
  authorizeRoles("VEHICLE_WITH_JOB", "ADMIN", "SUPER_ADMIN"),
  paymentController.getPayoutHistory,
);

module.exports = router;