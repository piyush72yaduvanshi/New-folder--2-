const express = require("express");
const router = express.Router();

const vehicleController = require("../controllers/vehicleController");

// ── STATIC ROUTES (must be BEFORE /:id) ──────────────────────────────────────
router.get("/categories", vehicleController.getCategories);
router.get("/featured",   vehicleController.getFeaturedVehicles);
router.get("/nearby",     vehicleController.getNearbyVehicles);

// location-based listing
router.get("/location/:locationId", vehicleController.getVehiclesByLocation);

// ── BASE ROUTES ───────────────────────────────────────────────────────────────
router.get("/",    vehicleController.getAllVehicles);
router.get("/:id", vehicleController.getVehicleById);

// ── SUB-RESOURCE ROUTES ───────────────────────────────────────────────────────
router.get("/:id/availability", vehicleController.checkAvailability);
router.get("/:id/pricing",      vehicleController.getVehiclePricing);
router.get("/:id/reviews",      vehicleController.getVehicleReviews);
router.get("/:id/specs",        vehicleController.getVehicleSpecs);

module.exports = router;
