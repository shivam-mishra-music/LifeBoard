import prisma from "../prismaClient.js";

// CREATE SUMMARY
export async function create(req, res) {
  try {
    const userId = req.user.userId;
    const date = new Date(req.body.date);

    // Check if summary already exists
    const existing = await prisma.daySummary.findFirst({
      where: { userId, date },
    });

    if (existing) {
      // Update ONLY journal
      const updated = await prisma.daySummary.update({
        where: { id: existing.id },
        data: { journal: req.body.journal ?? existing.journal },
      });

      return res.json({ summary: updated, updated: true });
    }

    // Create new
    const created = await prisma.daySummary.create({
      data: {
        date,
        userId,
        mood: req.body.mood || null,
        productivity: req.body.productivity || null,
        journal: req.body.journal || null,
      },
    });

    return res.status(201).json({ summary: created });
  } catch (error) {
    console.error("Create Error:", error);
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
}

// UPDATE SUMMARY (journal only)
export async function update(req, res) {
  try {
    const id = Number(req.params.id);

    const updated = await prisma.daySummary.update({
      where: { id },
      data: {
        journal: req.body.journal,
      },
    });

    return res.json({ summary: updated });
  } catch (err) {
    console.error("Update Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

// GET BY DATE
export async function getByDate(req, res) {
  try {
    const userId = req.user.userId;
    const { date } = req.params;

    const summary = await prisma.daySummary.findFirst({
      where: {
        userId,
        date: new Date(date),
      },
    });

    return res.json({ summary });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error fetching summary" });
  }
}

// GET MONTH
export async function getMonth(req, res) {
  try {
    const { month } = req.query; // yyyy-mm
    const userId = req.user.userId;

    const [year, mon] = month.split("-");

    const start = new Date(year, Number(mon) - 1, 1);
    const end = new Date(year, Number(mon), 0);

    const summaries = await prisma.daySummary.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
    });

    return res.json({ summaries });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error loading month summaries" });
  }
}

// DELETE SUMMARY
export async function remove(req, res) {
  try {
    const id = Number(req.params.id);

    await prisma.daySummary.delete({
      where: { id },
    });

    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete Error:", err);
    return res.status(500).json({ error: "Could not delete summary" });
  }
}

// 🔥 NEW: LAST 7 DAYS FOR OVERVIEW CHARTS
export async function getLast7(req, res) {
  try {
    const userId = req.user.userId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - 6); // last 7 days including today

    const rows = await prisma.daySummary.findMany({
      where: {
        userId,
        date: { gte: start, lte: today },
      },
      orderBy: { date: "asc" },
    });

    // Build continuous 7-day array with null-safe values
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      const key = d.toISOString().slice(0, 10);

      const match = rows.find(
        (r) => r.date.toISOString().slice(0, 10) === key
      );

      days.push({
        date: key,
        mood: match?.mood || null, // "good" | "moderate" | "bad" | null
        productivity: match?.productivity ?? null, // 1–5 or null
      });
    }

    return res.json({ days });
  } catch (err) {
    console.error("getLast7 Error:", err);
    return res.status(500).json({ error: "Error loading last 7 days" });
  }
}
