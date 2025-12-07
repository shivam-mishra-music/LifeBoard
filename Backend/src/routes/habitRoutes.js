import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createHabit,
  getHabits,
  deleteHabit,
  toggleToday,
  getHabitDetail,
} from "../controllers/habitController.js";

const router = express.Router();

// Create / list / delete
router.post("/", authMiddleware, createHabit);
router.get("/", authMiddleware, getHabits);
router.delete("/:id", authMiddleware, deleteHabit);

// Mark ONLY today (one-way – once done, can't unmark)
router.post("/:id/toggle-today", authMiddleware, toggleToday);

// Detail (for heatmap – read-only)
router.get("/:id/detail", authMiddleware, getHabitDetail);

export default router;
