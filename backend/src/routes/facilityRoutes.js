// src/routes/facilityRoutes.js
import express from "express";
import { facilities } from "../data/mock.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, (req, res) => {
  res.json(facilities);
});

export default router;
