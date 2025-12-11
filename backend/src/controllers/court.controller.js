// src/controllers/court.controller.js
import prisma from "../config/prisma.js";
import { facilities } from "../data/mock.js";
import { sendEmail } from "../utils/email.js";

// Helpers
const MOROCCO_TZ = "Africa/Casablanca";
const matchesFacility = (a, b) => a && b && String(a).toLowerCase() === String(b).toLowerCase();

// Convert a date+time string (YYYY-MM-DD, HH:mm) to a Date object anchored to Morocco time
const toMoroccoDateTime = (dateStr, timeStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0));
};

const parseHourMinute = (timeStr) => {
  const [h, m] = (timeStr || "00:00").split(":").map(Number);
  return { hour: h || 0, minute: m || 0 };
};

// Current time in Morocco
const moroccoNow = () => new Date(new Date().toLocaleString("en-US", { timeZone: MOROCCO_TZ }));

const diffInMinutes = (a, b) => (a.getTime() - b.getTime()) / (1000 * 60);

// Map DB reservation to API shape
const shapeReservation = (r) => {
  const facility = facilities.find((f) => f.id === r.facilityId);
  const startIso = r.startTime.toISOString();
  const endIso = r.endTime.toISOString();
  return {
    id: r.id,
    userId: r.userId,
    userName: r.user?.username,
    userEmail: r.user?.email,
    facilityId: r.facilityId,
    facilityName: facility?.name ?? r.facilityId,
    date: startIso.slice(0, 10),
    startTime: startIso.slice(11, 16),
    endTime: endIso.slice(11, 16),
    status: r.status,
    totalPrice: r.totalPrice ?? 0,
    paidAt: r.paidAt,
    createdAt: r.createdDate,
  };
};

// ---------------- CREATE BOOKING (STUDENT) ----------------
export const createBooking = async (req, res) => {
  const { facilityId, date, startTime, bikeType, rentalPlan } = req.body || {};

  if (!facilityId || !date || !startTime) {
    return res.status(400).json({ error: "facilityId, date and startTime are required" });
  }

  const facility = facilities.find((f) => f.id === facilityId);
  if (!facility) {
    return res.status(404).json({ error: "Facility not found" });
  }

  // Always 1-hour slot for courts / fields / padel
  const start = toMoroccoDateTime(date, startTime);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const { hour: startHour, minute: startMinute } = parseHourMinute(startTime);

  // -------- RULES FOR FUTSAL & HALF FIELD --------
  if (facility.type === "futsal" || facility.type === "half_field") {
    // Last booking time = 20:00 (8pm)
    if (startHour > 20 || (startHour === 20 && startMinute > 0)) {
      return res.status(400).json({ error: "Last booking time for this field is 8pm." });
    }
  }

  // -------- RULES FOR BICYCLES --------
  let bikeOptions = null;

  if (facility.type === "bicycles") {
    if (!bikeType || !rentalPlan) {
      return res.status(400).json({ error: "bikeType and rentalPlan are required for bicycle bookings." });
    }

    // Last bicycle booking at 17:00 (5pm)
    if (startHour > 17 || (startHour === 17 && startMinute > 0)) {
      return res.status(400).json({ error: "Last booking time for bicycles is 5pm." });
    }

    bikeOptions = { bikeType, rentalPlan };
  }

  // -------- TIME CONFLICT CHECK (DB) --------
  const conflict = await prisma.reservation.findFirst({
    where: {
      facilityId: facility.id,
      status: { notIn: ["CANCELLED", "REJECTED"] },
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });

  if (conflict) {
    return res.status(400).json({ error: "This time slot is already booked for this facility." });
  }

  // -------- PRICE CALCULATION --------
  let totalPrice = 0;

  // Light pricing for futsal / half field
  if (facility.type === "futsal" && startHour >= 18) {
    totalPrice += 30;
  }
  if (facility.type === "half_field" && startHour >= 18) {
    totalPrice += 40;
  }

  // Generic evening light fee (tennis, padel, basketball, etc.)
  if ((facility.type === "tennis" || facility.type === "padel" || facility.type === "basketball") && startHour >= 18) {
    totalPrice += 30;
  }

  // Bicycle pricing
  if (facility.type === "bicycles") {
    if (bikeType === "normal") {
      switch (rentalPlan) {
        case "2h": totalPrice = 20; break;
        case "daily": totalPrice = 50; break;
        case "3d": totalPrice = 130; break;
        case "weekly": totalPrice = 200; break;
        default: return res.status(400).json({ error: "Invalid rentalPlan." });
      }
    } else if (bikeType === "pro") {
      switch (rentalPlan) {
        case "2h": totalPrice = 40; break;
        case "daily": totalPrice = 80; break;
        case "3d": totalPrice = 170; break;
        case "weekly": totalPrice = 400; break;
        default: return res.status(400).json({ error: "Invalid rentalPlan." });
      }
    } else {
      return res.status(400).json({ error: "Invalid bikeType." });
    }
  }

  // -------- CREATE PENDING/CONFIRMED BOOKING --------
  const needsPaymentApproval = facility.type === "bicycles" || startHour >= 18;
  const status = needsPaymentApproval ? "PENDING" : "CONFIRMED";

  const created = await prisma.reservation.create({
    data: {
      userId: req.user.id,
      facilityId: facility.id,
      startTime: start,
      endTime: end,
      participantCount: 1,
      status,
      totalPrice,
      bikeType: bikeOptions?.bikeType,
      rentalPlan: bikeOptions?.rentalPlan,
    },
    include: { user: { select: { username: true, email: true } } },
  });

  // Email to user: booking created (pending/confirmed)
  sendEmail(
    created.user?.email ?? req.user.email,
    "CourtConnect – Booking Request Received",
    `Hi ${created.user?.username ?? req.user.username}, your booking request was created.
Facility: ${facility.name}
Date: ${date}
Time: ${startTime}–${end.toISOString().slice(11, 16)}
Price: ${totalPrice} dh
Status: ${status === "PENDING" ? "PENDING (awaiting admin approval)" : "CONFIRMED"}.`
  );

  const shaped = shapeReservation({ ...created, facility });
  return res.status(201).json({ message: "Booking created", booking: shaped });
};

// ---------------- GET BOOKINGS ----------------
export const getBookings = async (req, res) => {
  const isAdmin = req.user.role === "ADMIN" || req.user.role === "SUPERADMIN";

  const reservations = await prisma.reservation.findMany({
    where: isAdmin ? {} : { userId: req.user.id },
    include: { user: { select: { id: true, username: true, email: true } } },
    orderBy: { startTime: "asc" },
  });

  return res.json(reservations.map(shapeReservation));
};

export const getMyBookings = getBookings;

// ---------------- CANCEL BOOKING ----------------
export const cancelBooking = async (req, res) => {
  const bookingId = Number(req.params.id);

  const reservation = await prisma.reservation.findUnique({
    where: { id: bookingId },
    include: { user: { select: { email: true, username: true, id: true } } },
  });

  if (!reservation) return res.status(404).json({ error: "Booking not found" });

  if (!["ADMIN", "SUPERADMIN"].includes(req.user.role) && reservation.userId !== req.user.id) {
    return res.status(403).json({ error: "You are not allowed to cancel this booking." });
  }

  const start = reservation.startTime;
  const now = moroccoNow();
  const minutesBeforeStart = diffInMinutes(start, now);

  if (req.user.role === "STUDENT" && minutesBeforeStart <= 120 && minutesBeforeStart > 0) {
    return res.status(400).json({ error: "You cannot cancel a booking less than 2 hours before the start time." });
  }

  await prisma.reservation.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });

  const facility = facilities.find((f) => f.id === reservation.facilityId);

  if (reservation.user) {
    sendEmail(
      reservation.user.email,
      "CourtConnect – Booking Cancelled",
      `Hi ${reservation.user.username}, your booking has been cancelled.
Facility: ${facility?.name ?? "Unknown"}
Date: ${reservation.startTime.toISOString().slice(0, 10)}
Time: ${reservation.startTime.toISOString().slice(11, 16)}–${reservation.endTime.toISOString().slice(11, 16)}
Status: CANCELLED`
    );
  }

  const others = await prisma.user.findMany({
    where: { id: { not: reservation.userId } },
    select: { email: true },
  });

  others.forEach((u) =>
    sendEmail(
      u.email,
      "CourtConnect – Slot Available",
      `A booking was cancelled for ${facility?.name ?? "a facility"} on ${reservation.startTime.toISOString().slice(0, 10)} at ${reservation.startTime.toISOString().slice(11, 16)}.`
    )
  );

  res.json({ message: "Booking cancelled" });
};

// ---------------- ADMIN – PENDING BOOKINGS ----------------
export const getPendingBookings = async (_req, res) => {
  const pending = await prisma.reservation.findMany({ where: { status: "PENDING" } });
  res.json(pending.map(shapeReservation));
};

// ---------------- ADMIN – CONFIRM BOOKING ----------------
export const confirmBooking = async (req, res) => {
  const bookingId = Number(req.params.id);
  const reservation = await prisma.reservation.findUnique({
    where: { id: bookingId },
    include: { user: { select: { id: true, email: true, username: true, balance: true } } },
  });

  if (!reservation) return res.status(404).json({ error: "Booking not found" });
  if (reservation.status !== "PENDING") {
    return res.status(400).json({ error: "Only pending bookings can be confirmed." });
  }

  // Pending bookings always require admin action (evening courts or bicycles)

  if (!reservation.user) return res.status(404).json({ error: "User not found for this booking." });
  if ((reservation.user.balance ?? 0) < (reservation.totalPrice ?? 0)) {
    return res.status(400).json({ error: "User has insufficient CashWallet balance." });
  }

  // Needed for the confirmation email template
  const facility = facilities.find((f) => f.id === reservation.facilityId);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: reservation.user.id },
      data: { balance: { decrement: reservation.totalPrice ?? 0 } },
    }),
    prisma.reservation.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED", paidAt: new Date() },
    }),
  ]);

  sendEmail(
    reservation.user.email,
    "CourtConnect - Booking Confirmed",
    `Hi ${reservation.user.username}, your booking has been confirmed and paid via CashWallet.
Facility: ${facility?.name ?? "Unknown"}
Date: ${reservation.startTime.toISOString().slice(0, 10)}
Time: ${reservation.startTime.toISOString().slice(11, 16)}–${reservation.endTime.toISOString().slice(11, 16)}
Total paid: ${reservation.totalPrice ?? 0} dh
Status: CONFIRMED`
  );

  res.json({ message: "Booking confirmed and CashWallet updated." });
};

// ---------------- ADMIN – DECLINE BOOKING ----------------
export const declineBooking = async (req, res) => {
  const bookingId = Number(req.params.id);
  const reservation = await prisma.reservation.findUnique({
    where: { id: bookingId },
    include: { user: { select: { email: true, username: true } } },
  });

  if (!reservation) return res.status(404).json({ error: "Booking not found" });
  if (reservation.status !== "PENDING") {
    return res.status(400).json({ error: "Only pending bookings can be declined." });
  }

  // Pending bookings always require admin action (evening courts or bicycles)
  const facility = facilities.find((f) => f.id === reservation.facilityId);

  await prisma.reservation.update({ where: { id: bookingId }, data: { status: "REJECTED", declinedAt: new Date() } });

  if (reservation.user) {
    sendEmail(
      reservation.user.email,
      "CourtConnect – Booking Declined",
      `Hi ${reservation.user.username}, your booking was declined by the admin.
Facility: ${facility?.name ?? "Unknown"}
Date: ${reservation.startTime.toISOString().slice(0, 10)}
Time: ${reservation.startTime.toISOString().slice(11, 16)}–${reservation.endTime.toISOString().slice(11, 16)}
Status: REJECTED`
    );
  }

  res.json({ message: "Booking declined." });
};

// ---------------- ADMIN – CLEAR ALL BOOKINGS ----------------
export const clearBookings = async (_req, res) => {
  await prisma.reservation.deleteMany();
  res.json({ message: "All bookings cleared." });
};

// ---------------- AVAILABILITY (for students to see taken slots) ----------------
export const getAvailability = async (req, res) => {
  const { facilityId } = req.params;
  const { date } = req.query;

  if (!facilityId || !date) {
    return res.status(400).json({ error: "facilityId and date are required" });
  }

  const dayStart = toMoroccoDateTime(date, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const dayBookings = await prisma.reservation.findMany({
    where: {
      facilityId,
      status: { notIn: ["CANCELLED", "REJECTED"] },
      startTime: { gte: dayStart, lt: dayEnd },
    },
    select: { startTime: true, endTime: true, status: true },
  });

  const slots = dayBookings.map((b) => ({
    startTime: b.startTime.toISOString().slice(11, 16),
    endTime: b.endTime.toISOString().slice(11, 16),
    status: b.status,
  }));

  res.json({ facilityId, date, slots });
};
