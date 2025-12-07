import prisma from "../prismaClient.js";

// CREATE SUMMARY
export async function create(req, res) {
  try {
    const userId = req.user.userId;
    const date = new Date(req.body.date);

    // Check if summary already exists
    const existing = await prisma.daySummary.findFirst({
      where: { userId, date }
    });

    if (existing) {
      // Update ONLY journal
      const updated = await prisma.daySummary.update({
        where: { id: existing.id },
        data: { journal: req.body.journal ?? existing.journal }
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
        journal: req.body.journal || null
      }
    });

    return res.status(201).json({ summary: created });
  } catch (error) {
    console.error("Create Error:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
}


// UPDATE SUMMARY
export async function update(req, res) {
  try {
    const id = Number(req.params.id);

    const updated = await prisma.daySummary.update({
      where: { id },
      data: {
        journal: req.body.journal
      }
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

    // Normalize date to UTC midnight
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);

    const summary = await prisma.daySummary.findFirst({
      where: {
        userId,
        date: d
      }
    });

    return res.json({ summary });

  } catch (err) {
    console.error("getByDate error:", err);
    return res.status(500).json({ error: "Error fetching summary" });
  }
}


// GET MONTH
export async function getMonth(req, res) {
  try {
    const { month } = req.query;
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

export async function remove(req, res) {
  try {
    const id = Number(req.params.id);

    await prisma.daySummary.delete({
      where: { id }
    });

    return res.json({ message: "Deleted" });

  } catch (err) {
    console.error("Delete Error:", err);
    return res.status(500).json({ error: "Could not delete summary" });
  }
}