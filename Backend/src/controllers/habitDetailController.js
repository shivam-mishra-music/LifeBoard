import prisma from "../prismaClient.js";

// ---------- Helpers ----------

// normalize JS Date to start-of-day UTC
function startOfDayUTC(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// build YYYY-MM-DD key (UTC)
function dayKey(date) {
  return startOfDayUTC(date).toISOString().slice(0, 10);
}

// Compute streaks (current + longest) and todayDone from completions
function computeStreakStats(completions) {
  if (!completions.length) {
    return { todayDone: false, currentStreak: 0, longestStreak: 0 };
  }

  const keys = completions
    .map((c) => dayKey(c.date))
    .sort(); // ascending

  const keySet = new Set(keys);
  const today = dayKey(new Date());

  // today done?
  const todayDone = keySet.has(today);

  // current streak (backwards from today)
  let currentStreak = 0;
  let cursor = startOfDayUTC(new Date());
  while (keySet.has(dayKey(cursor))) {
    currentStreak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // longest streak over all completions
  let longestStreak = 1;
  let streak = 1;

  for (let i = 1; i < keys.length; i++) {
    const prev = new Date(keys[i - 1]);
    const curr = new Date(keys[i]);

    const diffDays = Math.round(
      (startOfDayUTC(curr) - startOfDayUTC(prev)) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      streak++;
    } else if (diffDays > 1) {
      streak = 1;
    }

    if (streak > longestStreak) longestStreak = streak;
  }

  return {
    todayDone,
    currentStreak: todayDone ? currentStreak : 0,
    longestStreak,
  };
}

// ---------- CONTROLLERS ----------

// POST /api/habits
export async function createHabit(req, res) {
  try {
    const userId = req.user.userId;
    const { name, color, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Habit name is required" });
    }

    const habit = await prisma.habit.create({
      data: {
        name: name.trim(),
        color: color || null,
        icon: icon || null,
        userId,
      },
    });

    return res.status(201).json({ habit });
  } catch (err) {
    console.error("Create habit error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// GET /api/habits
// Returns habits + streak info (summary list)
export async function getHabits(req, res) {
  try {
    const userId = req.user.userId;

    const habits = await prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    if (!habits.length) {
      return res.json({ habits: [] });
    }

    const completions = await prisma.habitCompletion.findMany({
      where: { userId },
    });

    const byHabit = new Map();
    for (const c of completions) {
      if (!byHabit.has(c.habitId)) byHabit.set(c.habitId, []);
      byHabit.get(c.habitId).push(c);
    }

    const todayKey = dayKey(new Date());

    const result = habits.map((h) => {
      const comps = byHabit.get(h.id) || [];
      const { todayDone, currentStreak, longestStreak } =
        computeStreakStats(comps);

      return {
        id: h.id,
        name: h.name,
        color: h.color,
        icon: h.icon,
        createdAt: h.createdAt,
        todayDone,
        currentStreak,
        longestStreak,
        totalDays: comps.length,
        lastDone:
          comps.length > 0
            ? startOfDayUTC(comps[comps.length - 1].date)
                .toISOString()
                .slice(0, 10)
            : null,
      };
    });

    return res.json({ habits: result, today: todayKey });
  } catch (err) {
    console.error("Get habits error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// NEW: GET /api/habits/:id/detail
// Full detail + last 365 days completions for heatmap
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

    const today = startOfDayUTC(new Date());
    const oneYearAgo = new Date(today);
    oneYearAgo.setUTCDate(oneYearAgo.getUTCDate() - 364);

    const completions = await prisma.habitCompletion.findMany({
      where: {
        userId,
        habitId,
        date: {
          gte: oneYearAgo,
          lte: today,
        },
      },
      orderBy: { date: "asc" },
    });

    const stats = computeStreakStats(completions);

    return res.json({
      habit: {
        id: habit.id,
        name: habit.name,
        icon: habit.icon,
        color: habit.color,
      },
      completions,
      stats,
    });
  } catch (err) {
    console.error("getHabitDetail error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// DELETE /api/habits/:id
export async function deleteHabit(req, res) {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);

    await prisma.habitCompletion.deleteMany({
      where: { habitId: id, userId },
    });

    await prisma.habit.delete({
      where: { id },
    });

    return res.json({ message: "Habit deleted" });
  } catch (err) {
    console.error("Delete habit error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// POST /api/habits/:id/toggle-today  (existing behaviour)
export async function toggleToday(req, res) {
  try {
    const userId = req.user.userId;
    const habitId = Number(req.params.id);

    const today = startOfDayUTC(new Date());

    const existing = await prisma.habitCompletion.findFirst({
      where: { userId, habitId, date: today },
    });

    if (existing) {
      await prisma.habitCompletion.delete({ where: { id: existing.id } });
      return res.json({ done: false });
    } else {
      await prisma.habitCompletion.create({
        data: {
          userId,
          habitId,
          date: today,
        },
      });
      return res.status(201).json({ done: true });
    }
  } catch (err) {
    console.error("Toggle today error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// NEW: POST /api/habits/:id/toggle-date
// For now: allow ANY date (for playing with the heatmap)
export async function toggleDate(req, res) {
  try {
    const userId = req.user.userId;
    const habitId = Number(req.params.id);
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }

    const day = startOfDayUTC(date);

    const existing = await prisma.habitCompletion.findFirst({
      where: {
        userId,
        habitId,
        date: day,
      },
    });

    if (existing) {
      await prisma.habitCompletion.delete({ where: { id: existing.id } });
      return res.json({ done: false, date: day.toISOString() });
    } else {
      const created = await prisma.habitCompletion.create({
        data: {
          userId,
          habitId,
          date: day,
        },
      });
      return res
        .status(201)
        .json({ done: true, date: created.date.toISOString() });
    }
  } catch (err) {
    console.error("toggleDate error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
