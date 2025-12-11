// src/routes/timeRoutes.js
import express from "express";

const router = express.Router();

const MOROCCO_TZ = "Africa/Casablanca";
const moroccoNow = () =>
  new Date(new Date().toLocaleString("en-US", { timeZone: MOROCCO_TZ }));

router.get("/morocco", (req, res) => {
  const now = moroccoNow();
  res.json({
    timezone: MOROCCO_TZ,
    iso: now.toISOString(),
  });
});

export default router;
