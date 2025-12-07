import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createHabit,
  getHabits,
  deleteHabit,
  toggleToday,
  getHabitDetail,
  toggleDate,
} from "../controllers/habitController.js";

const router = express.Router();

// Create / list / delete
router.post("/", authMiddleware, createHabit);
router.get("/", authMiddleware, getHabits);
router.delete("/:id", authMiddleware, deleteHabit);

// Old: toggle only today (used by "Done today" button)
router.post("/:id/toggle-today", authMiddleware, toggleToday);

// NEW: full detail (for heatmap) + toggle any date (for testing)
router.get("/:id/detail", authMiddleware, getHabitDetail);
router.post("/:id/toggle-date", authMiddleware, toggleDate);

export default router;
