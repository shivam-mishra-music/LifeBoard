import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import prisma from "../prismaClient.js";
import Groq from "groq-sdk";

const router = express.Router();

/**
 * POST /api/chat/send
 * Send a message to AI Coach and get a response
 */
router.post("/send", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    // Save user message to DB
    await prisma.chatMessage.create({
      data: {
        content: message,
        role: "user",
        userId,
      },
    });

    // Get user's recent context (tasks, habits, mood)
    const [tasks, habits, lastSummary] = await Promise.all([
      prisma.task.findMany({ where: { userId }, take: 5, orderBy: { createdAt: "desc" } }),
      prisma.habit.findMany({ where: { userId }, take: 5 }),
      prisma.daySummary.findFirst({ where: { userId }, orderBy: { date: "desc" } }),
    ]);

    // Build context for AI
    const context = `
User's current context:
- Tasks: ${tasks.map(t => `${t.title} (${t.completed ? "✓" : "pending"})`).join(", ")}
- Habits: ${habits.map(h => h.name).join(", ")}
- Today's mood: ${lastSummary?.mood || "not logged"}
- Today's productivity: ${lastSummary?.productivity || "not logged"}/5

User message: "${message}"

Respond as a supportive life coach. Be conversational, empathetic, and actionable. Keep it under 200 words.`;

    // Get AI response from Groq
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const aiResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 256,
      messages: [{ role: "user", content: context }],
    });

    const assistantMessage = aiResponse.choices[0].message.content;

    // Save AI response to DB
    await prisma.chatMessage.create({
      data: {
        content: assistantMessage,
        role: "assistant",
        userId,
      },
    });

    res.json({
      success: true,
      message: assistantMessage,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Could not process chat" });
  }
});

/**
 * GET /api/chat/history
 * Get chat conversation history
 */
router.get("/history", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    res.json({
      success: true,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/chat/clear
 * Clear chat history
 */
router.delete("/clear", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    await prisma.chatMessage.deleteMany({
      where: { userId },
    });

    res.json({ success: true, message: "Chat history cleared" });
  } catch (error) {
    console.error("Clear error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;