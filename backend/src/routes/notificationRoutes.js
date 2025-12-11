// src/routes/notificationRoutes.js
import express from "express";
import { notifications } from "../data/mock.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get notifications for current user (email-based since mock storage uses email)
router.get("/", protect, (req, res) => {
  const userEmail = req.user.email?.toLowerCase();
  const mine = notifications.filter(
    (n) => n.to?.toLowerCase() === userEmail
  );
  res.json(mine);
});

// Clear all notifications for current user
router.delete("/", protect, (req, res) => {
  const userEmail = req.user.email?.toLowerCase();
  if (!userEmail) {
    return res.status(400).json({ error: "User email missing" });
  }

  // Remove in-place to keep reference stable
  for (let i = notifications.length - 1; i >= 0; i--) {
    if (notifications[i].to?.toLowerCase() === userEmail) {
      notifications.splice(i, 1);
    }
  }

  res.json({ message: "Notifications cleared" });
});

export default router;
