// src/controllers/noteController.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a note
export const createNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, content, color, pinned } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const note = await prisma.note.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        color: color || null,
        pinned: !!pinned,
        userId,
      },
    });

    res.status(201).json({ message: "Note created", note });
  } catch (err) {
    console.error("Create note error:", err);
    res.status(500).json({ message: "Server error while creating note" });
  }
};

// Get all notes for logged-in user with pagination, filtering, and sorting
export const getNotes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, pinned, color, category, sortBy = "updatedAt", order = "desc", search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { userId };

    if (pinned !== undefined) where.pinned = pinned === "true";
    if (color) where.color = color;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy = sortBy === "pinned" 
      ? [{ pinned: "desc" }, { updatedAt: "desc" }]
      : { [sortBy]: order };

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
      }),
      prisma.note.count({ where }),
    ]);

    res.status(200).json({
      notes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("Get notes error:", err);
    res.status(500).json({ message: "Server error while fetching notes" });
  }
};

// Update note (only own notes)
export const updateNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);

    const { title, content, category, color, pinned } = req.body;

    const data = {};

    if (title !== undefined) data.title = title.trim();
    if (content !== undefined) data.content = content.trim();
    if (category !== undefined)
      data.category = category.trim() === "" ? null : category.trim();
    if (color !== undefined) data.color = color;
    if (pinned !== undefined) data.pinned = pinned;

    const updated = await prisma.note.updateMany({
      where: { id, userId },
      data,
    });

    if (updated.count === 0) {
      return res.status(404).json({
        message: "Note not found or you do not own this note",
      });
    }

    const note = await prisma.note.findUnique({ where: { id } });

    res.json({ message: "Note updated", note });
  } catch (err) {
    console.error("Update note error:", err);
    res.status(500).json({ message: "Server error while updating note" });
  }
};
// Delete note
export const deleteNote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);

    const deleted = await prisma.note.deleteMany({
      where: { id, userId },
    });

    if (deleted.count === 0) {
      return res
        .status(404)
        .json({ message: "Note not found or you do not own this note" });
    }

    res.status(200).json({ message: "Note deleted" });
  } catch (err) {
    console.error("Delete note error:", err);
    res.status(500).json({ message: "Server error while deleting note" });
  }
};

