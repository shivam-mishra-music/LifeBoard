// src/controllers/taskController.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a new task
export const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;
    const userId = req.user.userId; // from JWT

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority ? priority.toUpperCase() : "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        userId,
      },
    });

    res.status(201).json({ message: "Task created", task });
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ message: "Server error while creating task" });
  }
};

// Get all tasks of logged-in user
export const getTasks = async (req, res) => {
  try {
    const userId = req.user.userId;

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ message: "Server error while fetching tasks" });
  }
};

// Update a task (only if it belongs to the user)
export const updateTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);
    const { title, description, completed, priority, dueDate } = req.body;

    const updated = await prisma.task.updateMany({
      where: { id, userId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(completed !== undefined ? { completed } : {}),
        ...(priority !== undefined ? { priority: priority.toUpperCase() } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      },
    });

    if (updated.count === 0) {
      return res
        .status(404)
        .json({ message: "Task not found or you do not own this task" });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    res.status(200).json({ message: "Task updated", task });
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ message: "Server error while updating task" });
  }
};

// Delete a task (only if it belongs to the user)
export const deleteTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);

    const deleted = await prisma.task.deleteMany({
      where: { id, userId },
    });

    if (deleted.count === 0) {
      return res
        .status(404)
        .json({ message: "Task not found or you do not own this task" });
    }

    res.status(200).json({ message: "Task deleted" });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ message: "Server error while deleting task" });
  }
};
