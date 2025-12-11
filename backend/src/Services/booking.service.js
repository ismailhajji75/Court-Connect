import prisma from "../config/prisma.js";

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"];

const toDate = (value, label) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} is invalid`);
  }
  return date;
};

export async function createReservation({
  userId,
  facilityId,
  startTime,
  endTime,
  participantCount = 1,
}) {
  if (!userId || !facilityId || !startTime || !endTime) {
    throw new Error("userId, facilityId, startTime and endTime are required");
  }

  if (participantCount <= 0) {
    throw new Error("participantCount must be greater than 0");
  }

  const start = toDate(startTime, "startTime");
  const end = toDate(endTime, "endTime");

  if (end <= start) {
    throw new Error("endTime must be after startTime");
  }

  // Use a transaction so the availability check and create happen atomically.
  return prisma.$transaction(async (tx) => {
    const facility = await tx.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new Error("Facility not found");
    }

    if (facility.isActive === false) {
      throw new Error("Facility is not active");
    }

    const overlapping = await tx.reservation.findFirst({
      where: {
        facilityId,
        status: { in: ACTIVE_STATUSES },
        NOT: [
          { endTime: { lte: start } }, // ends before window starts
          { startTime: { gte: end } }, // starts after window ends
        ],
      },
      select: { id: true },
    });

    if (overlapping) {
      throw new Error("Time slot not available");
    }

    return tx.reservation.create({
      data: {
        userId,
        facilityId,
        startTime: start,
        endTime: end,
        participantCount,
        status: "PENDING",
      },
    });
  });
}

export function getReservationsForUser(userId) {
  if (!userId) {
    throw new Error("userId is required");
  }

  return prisma.reservation.findMany({
    where: { userId },
    orderBy: { startTime: "asc" },
  });
}

export function getReservationById(reservationId) {
  if (!reservationId) {
    throw new Error("reservationId is required");
  }

  return prisma.reservation.findUnique({
    where: { id: reservationId },
  });
}

export async function cancelReservation({ reservationId, userId }) {
  if (!reservationId) {
    throw new Error("reservationId is required");
  }

  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    if (userId && reservation.userId !== userId) {
      throw new Error("Not authorized to cancel this reservation");
    }

    if (reservation.status === "CANCELLED") {
      return reservation;
    }

    if (reservation.status === "COMPLETED") {
      throw new Error("Completed reservations cannot be cancelled");
    }

    return tx.reservation.update({
      where: { id: reservationId },
      data: { status: "CANCELLED" },
    });
  });
}
