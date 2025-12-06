// src/routes/taskRoutes.js
import express from "express";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// All task routes are protected
router.post("/", verifyToken, createTask);      // POST /api/tasks
router.get("/", verifyToken, getTasks);        // GET  /api/tasks
router.put("/:id", verifyToken, updateTask);   // PUT  /api/tasks/:id
router.delete("/:id", verifyToken, deleteTask);// DELETE /api/tasks/:id

export default router;
