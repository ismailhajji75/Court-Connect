// src/routes/availabilityRoutes.js
import express from "express";
import { availabilities, getNextAvailabilityId } from "../data/mock.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Get all availability slots (public read)
router.get("/", (req, res) => {
  res.json(availabilities);
});

// Add a new availability slot (admin only)
router.post("/", protect, requireAdmin, (req, res) => {
  const {
    facilityId,
    facilityLabel,
    facility,
    facilityType,
    date,
    startTime,
    endTime,
    price,
    lightsAvailable,
  } = req.body || {};

  const resolvedFacilityId = facilityId || facility;
  const resolvedFacilityLabel = facilityLabel || facility;

  if (!resolvedFacilityId || !resolvedFacilityLabel || !date || !startTime || !endTime) {
    return res.status(400).json({ error: "facilityId, facilityLabel, date, startTime and endTime are required" });
  }

  const slot = {
    id: String(getNextAvailabilityId()),
    facilityId: resolvedFacilityId,
    facilityLabel: resolvedFacilityLabel,
    facility: resolvedFacilityLabel, // keep legacy field for compatibility
    facilityType: facilityType || "court",
    date,
    startTime,
    endTime,
    price: Number(price) || 0,
    lightsAvailable: !!lightsAvailable,
    createdAt: new Date().toISOString(),
  };

  availabilities.push(slot);
  res.status(201).json(slot);
});

// Delete availability (admin only)
router.delete("/:id", protect, requireAdmin, (req, res) => {
  const id = req.params.id;
  const idx = availabilities.findIndex((a) => String(a.id) === String(id));
  if (idx === -1) {
    return res.status(404).json({ error: "Availability not found" });
  }
  availabilities.splice(idx, 1);
  res.json({ message: "Availability deleted" });
});

export default router;
