import prisma from "../prismaClient.js";

// ---------- Helpers ----------

function startOfDayUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function dayKey(date) {
  return startOfDayUTC(date).toISOString().slice(0, 10);
}

function computeStreakStats(completions) {
  if (!completions.length) {
    return { todayDone: false, currentStreak: 0, longestStreak: 0 };
  }

  const keys = completions.map((c) => dayKey(c.date)).sort();
  const keySet = new Set(keys);

  const today = dayKey(new Date());
  const todayDone = keySet.has(today);

  // current streak (ending at today)
  let current = 0;
  let cursor = startOfDayUTC(new Date());
  while (keySet.has(dayKey(cursor))) {
    current++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // longest streak
  let longest = 1;
  let streak = 1;
  for (let i = 1; i < keys.length; i++) {
    const prev = new Date(keys[i - 1]);
    const curr = new Date(keys[i]);
    const diffDays = Math.round(
      (startOfDayUTC(curr) - startOfDayUTC(prev)) / 86400000
    );

    if (diffDays === 1) {
      streak++;
    } else {
      streak = 1;
    }
    if (streak > longest) longest = streak;
  }

  return {
    todayDone,
    currentStreak: todayDone ? current : 0,
    longestStreak: longest,
  };
}

// ---------- CREATE HABIT ----------

export async function createHabit(req, res) {
  try {
    const userId = req.user.userId;
    const { name, icon, color } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Habit name required" });
    }

    const habit = await prisma.habit.create({
      data: {
        userId,
        name: name.trim(),
        icon: icon || "🔥",
        color: color || "emerald",
      },
    });

    return res.status(201).json({ habit });
  } catch (err) {
    console.error("Create habit error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------- GET HABITS LIST ----------

export async function getHabits(req, res) {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, sortBy = "createdAt", order = "asc", search, color } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { userId };

    if (search) where.name = { contains: search, mode: "insensitive" };
    if (color) where.color = color;

    const [habits, total] = await Promise.all([
      prisma.habit.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
      }),
      prisma.habit.count({ where }),
    ]);

    if (!habits.length) return res.json({ habits: [], pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), totalPages: 0 } });

    const habitIds = habits.map(h => h.id);
    const completions = await prisma.habitCompletion.findMany({
      where: { userId, habitId: { in: habitIds } },
    });

    const byHabit = new Map();
    completions.forEach((c) => {
      if (!byHabit.has(c.habitId)) byHabit.set(c.habitId, []);
      byHabit.get(c.habitId).push(c);
    });

    const result = habits.map((h) => {
      const comps = byHabit.get(h.id) || [];
      const stats = computeStreakStats(comps);

      return {
        id: h.id,
        name: h.name,
        icon: h.icon,
        color: h.color,
        todayDone: stats.todayDone,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalDays: comps.length,
      };
    });

    return res.json({
      habits: result,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("Get habits error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------- DELETE HABIT ----------

export async function deleteHabit(req, res) {
  try {
    const userId = req.user.userId;
    const habitId = Number(req.params.id);

    await prisma.habitCompletion.deleteMany({
      where: { userId, habitId },
    });

    await prisma.habit.delete({ where: { id: habitId } });

    return res.json({ message: "Habit deleted" });
  } catch (err) {
    console.error("Delete habit error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------- TOGGLE TODAY (ONE-WAY) ----------
// Once marked, it CAN'T be removed.

export async function toggleToday(req, res) {
  try {
    const userId = req.user.userId;
    const habitId = Number(req.params.id);
    const today = startOfDayUTC(new Date());

    const existing = await prisma.habitCompletion.findFirst({
      where: { userId, habitId, date: today },
    });

    if (existing) {
      // Already marked → do nothing (one-way)
      return res.json({ done: true, message: "Already done for today" });
    }

    await prisma.habitCompletion.create({
      data: { userId, habitId, date: today },
    });

    return res.json({ done: true });
  } catch (err) {
    console.error("Toggle today error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// ---------- HABIT DETAIL (READ-ONLY) ----------

export async function getHabitDetail(req, res) {
  try {
    const userId = req.user.userId;
    const habitId = Number(req.params.id);

    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    const completions = await prisma.habitCompletion.findMany({
      where: { userId, habitId },
      orderBy: { date: "asc" },
    });

    const stats = computeStreakStats(completions);

    return res.json({
      habit,
      completions,
      stats,
    });
  } catch (err) {
    console.error("Get habit detail error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
