import prisma from "../prismaClient.js";

// ➤ CREATE SUMMARY
export function createDaySummary(userId, data) {
  return prisma.daySummary.create({
    data: {
      date: data.date,
      mood: data.mood,
      productivity: data.productivity,
      journal: data.journal,
      user: { connect: { id: userId } }, // FIXED
    },
  });
}


// ➤ UPDATE SUMMARY
export async function updateDaySummary(id, userId, data) {
  // Ensure the summary belongs to the user
  const existing = await prisma.daySummary.findFirst({
    where: { id: Number(id), userId }
  });

  if (!existing) {
    throw new Error("Not authorized to update this summary");
  }

  return prisma.daySummary.update({
    where: { id: Number(id) },
    data
  });
}


// ➤ GET SUMMARY BY DATE
export function getSummaryByDate(userId, date) {
  return prisma.daySummary.findFirst({
    where: {
      userId,
      date: new Date(date)
    }
  });
}


// ➤ GET ALL SUMMARIES IN A MONTH
export function getMonthSummaries(userId, year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return prisma.daySummary.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: { date: "asc" }
  });
}


// ➤ DELETE SUMMARY
export async function deleteSummary(id, userId) {
  const existing = await prisma.daySummary.findFirst({
    where: { id: Number(id), userId }
  });

  if (!existing) {
    throw new Error("Not authorized to delete this entry");
  }

  return prisma.daySummary.delete({
    where: { id: Number(id) }
  });
}
