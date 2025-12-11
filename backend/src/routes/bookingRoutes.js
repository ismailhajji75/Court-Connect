// src/routes/bookingRoutes.js
import express from "express";
import {
  createBooking,
  getBookings,
  getMyBookings,
  cancelBooking,
  getPendingBookings,
  confirmBooking,
  declineBooking,
  getAvailability,
  clearBookings,
} from "../controllers/court.controller.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// student routes
router.post("/", protect, createBooking);
router.get("/", protect, getBookings);
router.get("/me", protect, getMyBookings);
router.delete("/:id", protect, cancelBooking);

// admin routes
router.get("/pending/all", protect, requireAdmin, getPendingBookings);
router.post("/:id/confirm", protect, requireAdmin, confirmBooking);
router.post("/:id/decline", protect, requireAdmin, declineBooking);
router.get("/availability/:facilityId", protect, getAvailability);
router.delete("/all", protect, requireAdmin, clearBookings);

export default router;
