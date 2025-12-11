import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Use a dedicated SQLite file for tests so we don't pollute dev data.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..", "..");
const dbDir = path.resolve(backendRoot, "prisma", "prisma");
const devDbPath = path.join(dbDir, "dev.db");
const testDbPath = path.join(dbDir, "test.db");

const shouldSeedTestDb =
  !fs.existsSync(testDbPath) ||
  fs.statSync(testDbPath).size === 0;

if (shouldSeedTestDb && fs.existsSync(devDbPath)) {
  fs.mkdirSync(dbDir, { recursive: true });
  fs.copyFileSync(devDbPath, testDbPath);
}

process.env.NODE_ENV = "test";
process.env.DATABASE_URL_TEST = process.env.DATABASE_URL_TEST || "file:./prisma/test.db";
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

const { default: prisma } = await import("../config/prisma.js");
const { createBooking } = await import("../controllers/court.controller.js");

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
};

const createdReservationIds = [];

// Basic flow: create a booking, then ensure overlaps are blocked and DB is updated.
test("createBooking persists to DB and blocks overlapping slot", async () => {
  // reset reservations for a clean test window
  await prisma.reservation.deleteMany({});

  const req = {
    user: {
      id: 1, // seeded Admin user
      username: "Admin",
      email: "a.admin@aui.ma",
      role: "ADMIN",
    },
    body: {
      facilityId: "futsal",
      date: "2025-12-15",
      startTime: "16:00",
    },
  };

  const res = makeRes();
  await createBooking(req, res);

  assert.equal(res.statusCode, 201, "should create booking");
  assert.ok(res.body?.booking?.id, "booking id returned");
  createdReservationIds.push(res.body.booking.id);
  assert.equal(res.body.booking.startTime, "16:00");
  assert.equal(res.body.booking.endTime, "17:00");

  // DB should have one reservation
  const count = await prisma.reservation.count();
  assert.equal(count, 1);

  // Overlap attempt should be rejected
  const overlapReq = {
    ...req,
    user: { ...req.user, id: 2, email: "superadmin@courtconnect.com", username: "SuperAdmin" },
    body: { ...req.body, startTime: "16:30" },
  };
  const overlapRes = makeRes();
  await createBooking(overlapReq, overlapRes);
  assert.equal(overlapRes.statusCode, 400, "overlap should be blocked");
});

// Clean up any reservations created by this test suite so the dev DB stays tidy.
test.after(async () => {
  if (createdReservationIds.length) {
    await prisma.reservation.deleteMany({
      where: { id: { in: createdReservationIds } },
    });
  }
  await prisma.$disconnect();
});
