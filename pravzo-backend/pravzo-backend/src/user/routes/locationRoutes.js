const express = require("express");
const router = express.Router();

const locationController = require("../controllers/locationController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

router.post(
  "/update",
  authMiddleware,
  authorizeRoles("VEHICLE_WITH_JOB", "ADMIN", "SUPER_ADMIN"),
  locationController.updateRiderLocation,
);

router.get(
  "/nearby",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  locationController.getNearbyRiders,
);

module.exports = router;