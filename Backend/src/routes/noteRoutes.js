// src/routes/noteRoutes.js
import express from "express";
import {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
} from "../controllers/noteController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// All note routes are protected
router.post("/", verifyToken, createNote);       // POST   /api/notes
router.get("/", verifyToken, getNotes);         // GET    /api/notes
router.put("/:id", verifyToken, updateNote);    // PUT    /api/notes/:id
router.delete("/:id", verifyToken, deleteNote); // DELETE /api/notes/:id


export default router;
