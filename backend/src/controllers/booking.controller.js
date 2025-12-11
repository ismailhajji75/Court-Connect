import { bookings, courts } from "../data/mock.js";

const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

export const createBooking = (req, res) => {
  const { courtId, date, startTime, endTime } = req.body;
  const userId = req.user.id; // from JWT

  const court = courts.find(c => c.id === courtId);
  if (!court) return res.status(404).json({ error: "Court not found" });

  if (!courtId || !date || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
    return res.status(400).json({ error: "Invalid time format (HH:MM)" });
  }

  const startMin = toMinutes(startTime);
  const endMin = toMinutes(endTime);
  const durationMin = endMin - startMin;

  if (durationMin <= 0) {
    return res.status(400).json({ error: "startTime must be before endTime" });
  }

  const LIGHT_START_MIN = 18 * 60; // 18:00

  // ----- RULES -----
  let price = 0;
  let lightFee = 0;

  if (court.type === "bicycle") {
    // cannot book bikes after 18:00
    if (startMin >= LIGHT_START_MIN) {
      return res.status(400).json({ error: "You cannot book bicycles after 18:00" });
    }

    // 30dh per hour for bikes
    const hours = durationMin / 60;
    price = hours * 30;

    // only one bike booking per user at the same time
    const overlappingBike = bookings.find(b => {
      const bCourt = courts.find(c => c.id === b.courtId);
      const bStart = toMinutes(b.startTime);
      const bEnd = toMinutes(b.endTime);
      return (
        (b.status ?? "ACTIVE") === "ACTIVE" &&
        b.userId === userId &&
        b.date === date &&
        bCourt?.type === "bicycle" &&
        !(endMin <= bStart || startMin >= bEnd)
      );
    });

    if (overlappingBike) {
      return res.status(400).json({ error: "You already have a bicycle booked in that time range" });
    }

  } else {
    // COURTS: must be EXACTLY 1 hour
    if (durationMin !== 60) {
      return res.status(400).json({ error: "Courts must be booked for exactly 1 hour" });
    }

    // light: 30dh/h if any part of the hour is after 18:00
    if (endMin > LIGHT_START_MIN) {
      lightFee = 30;
    }

    price = lightFee; // court itself free, only pay light
  }

  // no double-booking (any sport)
  const conflict = bookings.find(b =>
    b.courtId === courtId &&
    b.date === date &&
    (b.status ?? "ACTIVE") === "ACTIVE" &&
    !(
      endMin <= toMinutes(b.startTime) ||
      startMin >= toMinutes(b.endTime)
    )
  );

  if (conflict) {
    return res.status(409).json({ error: "Court already booked for this time slot" });
  }

  const newBooking = {
    id: bookings.length + 1,
    userId,
    courtId,
    date,
    startTime,
    endTime,
    status: "ACTIVE",
    price,
    lightFee
  };

  bookings.push(newBooking);
  res.status(201).json(newBooking);
};

export const getBookings = (req, res) => {
  res.json(bookings);
};

export const getMyBookings = (req, res) => {
  const userId = req.user.id;
  const mine = bookings.filter(b => b.userId === userId);
  res.json(mine);
};
export const cancelBooking = (req, res) => {
  const bookingId = parseInt(req.params.id, 10);
  const userId = req.user.id;

  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  if (booking.userId !== userId) {
    return res.status(403).json({ error: "You can only cancel your own bookings" });
  }

  if ((booking.status ?? "ACTIVE") !== "ACTIVE") {
    return res.status(400).json({ error: "Booking is already cancelled" });
  }

  // build full Date from date + time
  const startDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
  const now = new Date();

  const diffMs = startDateTime - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  // rule: must be at least 2 hours before start
  if (diffHours < 2) {
    return res.status(400).json({
      error: "You can only cancel a booking at least 2 hours before it starts"
    });
  }

  booking.status = "CANCELLED";

  res.json({
    message: "Booking cancelled",
    booking
  });
};
