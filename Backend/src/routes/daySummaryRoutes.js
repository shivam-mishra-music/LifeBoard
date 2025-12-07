import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  create,
  update,
  getByDate,
  getMonth,
  remove
} from "../controllers/daySummaryController.js";

const router = express.Router();

router.post("/", authMiddleware, create);
router.put("/:id", authMiddleware, update);
router.get("/:date", authMiddleware, getByDate);
router.get("/", authMiddleware, getMonth);
router.delete("/:id", authMiddleware, remove);

export default router;
