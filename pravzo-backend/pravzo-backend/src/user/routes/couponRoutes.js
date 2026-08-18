const express = require("express");
const router = express.Router();

const couponController = require("../controllers/couponController");
const authMiddleware = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

// User routes
router.post("/validate", authMiddleware, couponController.validateCoupon);
router.post("/apply",    authMiddleware, couponController.applyCoupon);

// Admin routes
router.get(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  couponController.listCoupons
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  couponController.createCoupon
);

router.put(
  "/:code",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  couponController.toggleCoupon
);

// Admin: delete coupon (soft delete via is_active=0)
router.delete(
  "/:code",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  couponController.deleteCoupon
);

module.exports = router;
