import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import prisma from "../prismaClient.js";
import { generateDailyBriefing, suggestTaskPriority, generateJournalPrompts } from "../services/aiCoachService.js";
import { format, subDays, startOfDay } from "date-fns";

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "AI routes working! ✅", groqKey: process.env.GROQ_API_KEY ? "Set ✅" : "Missing ❌" });
});

// Helper: normalize date to start-of-day UTC
function dayKey(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/**
 * POST /api/ai/daily-briefing
 * Generate personalized morning briefing based on user's data
 */
router.post("/daily-briefing", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch all needed data
    const [user, tasks, habits, lastSevenSummaries] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.task.findMany({ where: { userId } }),
      prisma.habit.findMany({
        where: { userId },
        include: { completions: true },
      }),
      prisma.daySummary.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 7,
      }),
    ]);

    if (!user) return res.status(404).json({ error: "User not found" });

    // Calculate today's stats
    const today = startOfDay(new Date());
    const todaySummary = lastSevenSummaries.find(
      (s) => new Date(s.date).toDateString() === today.toDateString()
    );

    const pendingTasks = tasks.filter((t) => !t.completed);
    const todayTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString()
    );
    const todayCompleted = todayTasks.filter((t) => t.completed).length;

    // Habit stats
    const habitStats = habits.map((h) => {
      const completionDates = new Set(
        h.completions.map((c) => dayKey(c.date))
      );
      const todayKey = dayKey(today);
      const todayDone = completionDates.has(todayKey);

      // Current streak
      let currentStreak = 0;
      let cursor = new Date(today);
      while (completionDates.has(dayKey(cursor))) {
        currentStreak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }

      return {
        ...h,
        todayDone,
        currentStreak: todayDone ? currentStreak : 0,
      };
    });

    const topStreak = Math.max(...habitStats.map((h) => h.currentStreak || 0), 0);

    // Mood & productivity trends (last 7 days)
    const moodTrend = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      const found = lastSevenSummaries.find(
        (s) => new Date(s.date).toDateString() === d.toDateString()
      );
      return found?.mood || null;
    });

    const productivityTrend = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      const found = lastSevenSummaries.find(
        (s) => new Date(s.date).toDateString() === d.toDateString()
      );
      return found?.productivity || 0;
    });

    // Completion rate this week
    const weekTasks = tasks.filter((t) => {
      if (!t.dueDate) return false;
      const diff = Math.floor(
        (today - startOfDay(new Date(t.dueDate))) / (1000 * 60 * 60 * 24)
      );
      return diff >= 0 && diff < 7;
    });
    const completionRate =
      weekTasks.length > 0
        ? Math.round((weekTasks.filter((t) => t.completed).length / weekTasks.length) * 100)
        : 0;

    // Generate briefing
    const briefingResult = await generateDailyBriefing({
      userName: user.name || "Friend",
      todayMood: todaySummary?.mood,
      todayProductivity: todaySummary?.productivity,
      moodTrend,
      productivityTrend,
      pendingTasks,
      completedToday: todayCompleted,
      totalTasks: todayTasks.length,
      habits: habitStats,
      topStreak,
      completionRate,
    });

    res.json({
      success: briefingResult.success,
      briefing: briefingResult.briefing,
      stats: {
        todayCompleted,
        pendingTasks: pendingTasks.length,
        topStreak,
        moodTrend,
        completionRate,
      },
    });
  } catch (error) {
    console.error("Daily briefing error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/suggest-priority
 * Suggest priority for a task based on its content
 */
router.post("/suggest-priority", verifyToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });

    const result = await suggestTaskPriority(title, description);
    res.json(result);
  } catch (error) {
    console.error("Priority suggestion error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/journal-prompts
 * Generate journal reflection prompts
 */
router.post("/journal-prompts", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { mood, completedTasks, pendingTasks } = req.body;

    const result = await generateJournalPrompts(mood, completedTasks, pendingTasks);
    res.json(result);
  } catch (error) {
    console.error("Journal prompts error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;