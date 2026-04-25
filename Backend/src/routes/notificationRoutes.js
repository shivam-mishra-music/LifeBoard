import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import prisma from "../prismaClient.js";

const router = express.Router();

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const unreadOnly = req.query.unreadOnly === "true";

    const where = { userId };
    if (unreadOnly) where.read = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { sentAt: "desc" },
      take: 50,
    });

    res.json({
      success: true,
      notifications,
      unreadCount: await prisma.notification.count({ where: { userId, read: false } }),
    });
  } catch (error) {
    console.error("Notifications error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch("/:id/read", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = parseInt(req.params.id);

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    // Verify ownership
    if (notification.userId !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Read notification error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = parseInt(req.params.id);

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.notification.delete({ where: { id: notificationId } });

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/notifications/preferences
 * Get user's email preferences
 */
router.get("/preferences", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    let prefs = await prisma.emailPreference.findUnique({
      where: { userId },
    });

    // Create default if doesn't exist
    if (!prefs) {
      prefs = await prisma.emailPreference.create({
        data: {
          userId,
          dailyBriefing: true,
          weeklyReport: false,
          taskReminders: true,
          streakAlerts: true,
        },
      });
    }

    res.json({ success: true, preferences: prefs });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update email preferences
 */
router.put("/preferences", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { dailyBriefing, weeklyReport, taskReminders, streakAlerts } = req.body;

    // Get or create preferences
    let prefs = await prisma.emailPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await prisma.emailPreference.create({
        data: { userId },
      });
    }

    // Update
    const updated = await prisma.emailPreference.update({
      where: { userId },
      data: {
        ...(dailyBriefing !== undefined && { dailyBriefing }),
        ...(weeklyReport !== undefined && { weeklyReport }),
        ...(taskReminders !== undefined && { taskReminders }),
        ...(streakAlerts !== undefined && { streakAlerts }),
      },
    });

    res.json({ success: true, preferences: updated });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;