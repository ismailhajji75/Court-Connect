// src/routes/paymentRoutes.js
import express from "express";
import { createPaymentIntent } from "../controllers/payment.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/intent", protect, createPaymentIntent);

export default router;
//modified