
import app from "./app.js";
import dotenv from "dotenv";
import { scheduleEmailJob } from "./schedulers/emailScheduler.js";

dotenv.config();
const PORT = process.env.PORT || 5000;

scheduleEmailJob(); 

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
