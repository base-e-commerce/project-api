const { verifyToken } = require("../utils/jwt");
const prisma = require("../database/database");

class RealtimeNotificationService {
  constructor() {
    this.clients = new Map();
    this.nextClientId = 1;
    this.heartbeatMs = 25000;
    this.maxHistory = 200;
  }

  resolveToken(req) {
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.split(" ")[1];
    }

    const token = req.query?.token;
    if (typeof token === "string" && token.trim().length > 0) {
      return token.trim();
    }

    return null;
  }

  isAdminPayload(payload) {
    return payload?.role?.role_id === 1;
  }

  getAuthenticatedAdmin(req) {
    const token = this.resolveToken(req);
    if (!token) {
      return null;
    }
    const user = verifyToken(token);
    if (!user || !this.isAdminPayload(user)) {
      return null;
    }
    return user;
  }

  streamAdminNotifications(req, res) {
    const token = this.resolveToken(req);
    if (!token) {
      return res.status(401).json({ message: "Access token is missing" });
    }

    const user = verifyToken(token);
    if (!user || !this.isAdminPayload(user)) {
      return res.status(403).json({ message: "Access forbidden: Admin role required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    const clientId = this.nextClientId++;
    const heartbeat = setInterval(() => {
      res.write(": ping\n\n");
    }, this.heartbeatMs);

    this.clients.set(clientId, {
      res,
      heartbeat,
      userId: user.userId,
    });

    this.sendEvent(res, "connected", {
      type: "connected",
      message: "Realtime notifications connected",
      occurredAt: new Date().toISOString(),
    });

    req.on("close", () => {
      const client = this.clients.get(clientId);
      if (client) {
        clearInterval(client.heartbeat);
      }
      this.clients.delete(clientId);
    });

    return null;
  }

  sendEvent(res, eventName, payload) {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  async notifyAdmins(payload) {
    const stored = await this.storeNotification(payload);

    if (this.clients.size === 0) {
      return stored;
    }

    for (const [clientId, client] of this.clients.entries()) {
      try {
        const eventPayload = this.serializeForUser(stored, false);
        this.sendEvent(client.res, "admin.notification", eventPayload);
      } catch (error) {
        clearInterval(client.heartbeat);
        this.clients.delete(clientId);
      }
    }

    return stored;
  }

  async storeNotification(payload) {
    const created = await prisma.adminNotification.create({
      data: {
        type: payload?.type || "notification",
        title: payload?.title || "Nouvelle notification",
        message: payload?.message || "Nouvel evenement",
        route: payload?.route || "/dashboard",
        entity_type: payload?.entityType || "notification",
        entity_id:
          payload?.entityId !== undefined && payload?.entityId !== null
            ? Number(payload.entityId)
            : null,
        customer: payload?.customer || null,
        meta: payload?.meta || null,
        created_at: payload?.occurredAt ? new Date(payload.occurredAt) : undefined,
      },
    });

    const totalCount = await prisma.adminNotification.count();
    const overflow = totalCount - this.maxHistory;
    if (overflow > 0) {
      const oldest = await prisma.adminNotification.findMany({
        orderBy: { created_at: "asc" },
        take: overflow,
        select: { notification_id: true },
      });
      if (oldest.length > 0) {
        await prisma.adminNotification.deleteMany({
          where: {
            notification_id: {
              in: oldest.map((item) => item.notification_id),
            },
          },
        });
      }
    }

    return created;
  }

  serializeForUser(notification, isRead) {
    return {
      id: String(notification.notification_id),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      route: notification.route,
      entityType: notification.entity_type || "notification",
      entityId: notification.entity_id,
      occurredAt: notification.created_at,
      customer: notification.customer,
      meta: notification.meta,
      isRead: Boolean(isRead),
    };
  }

  async getAdminNotifications(userId, limit = 30) {
    const resolvedLimit = Number.isFinite(Number(limit))
      ? Math.max(1, Math.min(Number(limit), this.maxHistory))
      : 30;

    const notifications = await prisma.adminNotification.findMany({
      orderBy: { created_at: "desc" },
      take: resolvedLimit,
      include: {
        reads: {
          where: { user_id: userId },
          select: { notification_read_id: true },
        },
      },
    });

    return notifications.map((item) =>
      this.serializeForUser(item, item.reads.length > 0)
    );
  }

  async getUnreadCount(userId) {
    return prisma.adminNotification.count({
      where: {
        reads: {
          none: { user_id: userId },
        },
      },
    });
  }

  async markAllAsRead(userId) {
    const unread = await prisma.adminNotification.findMany({
      where: {
        reads: {
          none: { user_id: userId },
        },
      },
      select: { notification_id: true },
    });
    if (unread.length > 0) {
      await prisma.adminNotificationRead.createMany({
        data: unread.map((item) => ({
          notification_id: item.notification_id,
          user_id: userId,
        })),
        skipDuplicates: true,
      });
    }

    return this.getUnreadCount(userId);
  }

  async markAsRead(userId, notificationId) {
    const parsedId = Number(notificationId);
    if (!Number.isFinite(parsedId)) {
      return null;
    }

    const target = await prisma.adminNotification.findUnique({
      where: { notification_id: parsedId },
      include: {
        reads: {
          where: { user_id: userId },
          select: { notification_read_id: true },
        },
      },
    });

    if (!target) {
      return null;
    }

    if (target.reads.length === 0) {
      await prisma.adminNotificationRead.create({
        data: {
          notification_id: parsedId,
          user_id: userId,
        },
      });
    }

    return this.serializeForUser(target, true);
  }
}

module.exports = new RealtimeNotificationService();
