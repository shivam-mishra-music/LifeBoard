import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import daySummaryRoutes from "./routes/daySummaryRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json()); 

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/day-summary", daySummaryRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/ai", aiRoutes); 


app.get("/", (req, res) => {
  res.send("LifeBoard Backend Running 🚀");
});

export default app;
