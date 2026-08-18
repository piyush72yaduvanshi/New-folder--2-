const express = require("express");
const router = express.Router();

const resourceController = require("../controllers/resourceController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

// ── Charging Stations ────────────────────────────────────────────────────────
router.get("/charging-stations",     resourceController.getAllChargingStations);
router.get("/charging-stations/:id", resourceController.getChargingStationById);

router.post(
  "/charging-stations",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  resourceController.createChargingStation
);
router.put(
  "/charging-stations/:id",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  resourceController.updateChargingStation
);

// ── Guides / EV Tips ──────────────────────────────────────────────────────────
router.get("/guides",           resourceController.getAllGuides);
router.get("/guides/:idOrSlug", resourceController.getGuideById);

router.post(
  "/guides",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  resourceController.createGuide
);

module.exports = router;
