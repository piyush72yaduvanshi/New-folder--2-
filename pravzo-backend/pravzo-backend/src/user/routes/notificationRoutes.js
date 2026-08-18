const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");
const ownerMiddleware = require("../middleware/ownerMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRoles");

router.get(
  "/user/:userId",
  authMiddleware,
  ownerMiddleware("userId"),
  notificationController.getUserNotifications,
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  notificationController.createNotification,
);

router.put(
  "/:id/read",
  authMiddleware,
  notificationController.markAsRead,
);

router.put(
  "/user/:userId/read-all",
  authMiddleware,
  ownerMiddleware("userId"),
  notificationController.markAllAsRead,
);

module.exports = router;