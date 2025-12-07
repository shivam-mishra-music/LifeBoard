import {
  createDaySummary,
  updateDaySummary,
  getSummaryByDate,
  getMonthSummaries,
  deleteSummary
} from "../services/daySummaryService.js";

export async function create(req, res) {
  try {
    const userId = req.user.id;
    const { date, mood, productivity, journal } = req.body;

    const summary = await createDaySummary(userId, {
      date: new Date(date),
      mood,
      productivity,
      journal
    });

    return res.status(201).json({ summary });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Could not create summary" });
  }
}

export async function update(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const updated = await updateDaySummary(id, userId, req.body);
    return res.json({ updated });
  } catch (err) {
    return res.status(500).json({ error: "Could not update summary" });
  }
}

export async function getByDate(req, res) {
  try {
    const { date } = req.params;
    const userId = req.user.id;

    const summary = await getSummaryByDate(userId, date);
    return res.json({ summary });
  } catch (err) {
    return res.status(500).json({ error: "Error fetching summary" });
  }
}

export async function getMonth(req, res) {
  try {
    const { month } = req.query; // yyyy-mm
    const userId = req.user.id;

    const [year, mon] = month.split("-");
    const summaries = await getMonthSummaries(userId, year, mon);

    return res.json({ summaries });
  } catch (err) {
    return res.status(500).json({ error: "Error loading month summaries" });
  }
}

export async function remove(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await deleteSummary(id, userId);

    return res.json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Could not delete summary" });
  }
}
