import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  create,
  update,
  getByDate,
  getMonth,
  remove,
  getLast7,   // 👈 new
} from "../controllers/daySummaryController.js";

const router = express.Router();

router.post("/", authMiddleware, create);
router.put("/:id", authMiddleware, update);

// ⚠️ Important: keep /last7 BEFORE "/:date"
router.get("/last7", authMiddleware, getLast7);

router.get("/:date", authMiddleware, getByDate);
router.get("/", authMiddleware, getMonth);
router.delete("/:id", authMiddleware, remove);

export default router;
