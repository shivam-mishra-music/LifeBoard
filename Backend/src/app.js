import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json()); 

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("LifeBoard Backend Running 🚀");
});

export default app;
