const express = require("express");
const realtimeNotificationService = require("../services/realtime-notification.service");
const createResponse = require("../utils/api.response");

const router = express.Router();

router.get("/admin/stream", (req, res) => {
  realtimeNotificationService.streamAdminNotifications(req, res);
});

router.get("/admin/notifications", async (req, res) => {
  try {
    const user = realtimeNotificationService.getAuthenticatedAdmin(req);
    if (!user) {
      return res.status(403).json(createResponse("Access forbidden: Admin role required", null, false));
    }

    const limit = Number(req.query.limit ?? 30);
    const notifications = await realtimeNotificationService.getAdminNotifications(user.userId, limit);
    const unreadCount = await realtimeNotificationService.getUnreadCount(user.userId);
    return res
      .status(200)
      .json(createResponse("Notifications fetched successfully", { notifications, unreadCount }));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Failed to fetch notifications", error.message, false));
  }
});

router.put("/admin/notifications/read-all", async (req, res) => {
  try {
    const user = realtimeNotificationService.getAuthenticatedAdmin(req);
    if (!user) {
      return res.status(403).json(createResponse("Access forbidden: Admin role required", null, false));
    }

    const unreadCount = await realtimeNotificationService.markAllAsRead(user.userId);
    return res
      .status(200)
      .json(createResponse("Notifications marked as read", { unreadCount }));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Failed to mark notifications as read", error.message, false));
  }
});

router.put("/admin/notifications/:id/read", async (req, res) => {
  try {
    const user = realtimeNotificationService.getAuthenticatedAdmin(req);
    if (!user) {
      return res.status(403).json(createResponse("Access forbidden: Admin role required", null, false));
    }

    const notification = await realtimeNotificationService.markAsRead(user.userId, req.params.id);
    if (!notification) {
      return res.status(404).json(createResponse("Notification not found", null, false));
    }

    return res.status(200).json(createResponse("Notification marked as read", notification));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Failed to mark notification as read", error.message, false));
  }
});

module.exports = router;
