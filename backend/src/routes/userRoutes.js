// src/routes/userRoutes.js
import express from "express";
import { getAllUsers } from "../controllers/user.controller.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", protect, requireAdmin, getAllUsers);

export default router;
