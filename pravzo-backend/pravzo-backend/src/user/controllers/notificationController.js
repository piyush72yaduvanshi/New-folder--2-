const logger = require("../../../src/utils/logger");
const NotificationRepository = require("../repositories/NotificationRepository");
const { sendSuccess, sendError } = require('../../../src/utils/responseWrapper');

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const loggedInUserId = Number(req.user.id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user id is required",
      });
    }

    if (userId !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: "You can access only your own notifications",
      });
    }

    const notifications = await NotificationRepository.findByUserId(userId);

    return sendSuccess(res, 200, 'Notifications fetched successfully', { notifications }, { req });
  } catch (error) {
    logger.error("Get User Notifications Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { user_id, title, message, type, route_target } = req.body;

    if (!user_id || !title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: "user_id, title, message, and type are required",
      });
    }

    const fields = {
      user_id,
      title,
      message,
      type,
      route_target: route_target || null,
      is_read: false,
    };

    const notificationId = await NotificationRepository.create(fields);
    const inserted = await NotificationRepository.findById(notificationId);

    return sendSuccess(res, 201, 'Notification created successfully', { notification: inserted }, { req });
  } catch (error) {
    logger.error("Create Notification Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error.message,
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const loggedInUserId = Number(req.user.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid notification id is required",
      });
    }

    const notification = await NotificationRepository.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (Number(notification.user_id) !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: "You can update only your own notification",
      });
    }

    const success = await NotificationRepository.markAsRead(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read successfully",
    });
  } catch (error) {
    logger.error("Mark Notification As Read Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const loggedInUserId = Number(req.user.id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user id is required",
      });
    }

    if (userId !== loggedInUserId) {
      return res.status(403).json({
        success: false,
        message: "You can update only your own notifications",
      });
    }

    if (typeof NotificationRepository.markAllAsReadByUserId !== "function") {
      return res.status(500).json({
        success: false,
        message: "markAllAsReadByUserId repository method is missing",
      });
    }

    await NotificationRepository.markAllAsReadByUserId(userId);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read successfully",
    });
  } catch (error) {
    logger.error("Mark All Notifications As Read Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};