import prisma from "../prismaClient.js";

export function createDaySummary(userId, data) {
  return prisma.daySummary.create({
    data: { ...data, userId }
  });
}

export function updateDaySummary(id, userId, data) {
  return prisma.daySummary.update({
    where: { id: Number(id), userId },
    data
  });
}

export function getSummaryByDate(userId, date) {
  return prisma.daySummary.findFirst({
    where: {
      userId,
      date: new Date(date)
    }
  });
}

export function getMonthSummaries(userId, year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return prisma.daySummary.findMany({
    where: {
      userId,
      date: { gte: start, lte: end }
    }
  });
}

export function deleteSummary(id, userId) {
  return prisma.daySummary.delete({
    where: { id: Number(id), userId }
  });
}
