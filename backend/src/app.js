// src/app.js
import express from "express";
import cors from "cors";

import { env } from "./config/env.js";

import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import timeRoutes from "./routes/timeRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/users", userRoutes);
app.use("/api/time", timeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/audio", audioRoutes);

// Serve built frontend (same-origin) if present
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));
// Fallback to index.html for client routes
app.use((req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log("Server running on port " + env.PORT);
});
