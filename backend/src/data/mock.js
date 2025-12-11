// src/data/mock.js
import bcrypt from "bcryptjs";

// ---------------- USERS ----------------

export const users = [
  {
    id: 1,
    username: "Admin",
    email: "a.admin@aui.ma",
    role: "ADMIN",
    password: bcrypt.hashSync("admin123", 10),
    balance: 9999, // admin has "infinite" CashWallet
  },
  {
    id: 2,
    username: "SuperAdmin",
    email: "superadmin@courtconnect.com",
    role: "SUPERADMIN",
    password: bcrypt.hashSync("Q!7zP@92kL#tX4mB", 10),
    balance: 9999,
  },
  {
    id: 3,
    username: "Nabil",
    email: "n.bachiri@aui.ma",
    role: "STUDENT",
    password: bcrypt.hashSync("nabil123", 10),
    balance: 200, // example CashWallet balance
  },
  {
    id: 4,
    username: "Imane",
    email: "i.hajji@aui.ma",
    role: "STUDENT",
    password: bcrypt.hashSync("imane123", 10),
    balance: 150,
  },
];

let nextUserId = users.length + 1;
export const getNextUserId = () => nextUserId++;

// ---------------- FACILITIES ----------------
//
// Make sure facility IDs match what frontend sends in facilityId.
// Types are simple lowercase strings to align with frontend usage.

export const facilities = [
  // 1. Futsal (only one court)
  {
    id: "futsal",
    name: "Futsal Court 5v5",
    type: "futsal",
    location: "AUI Indoor Futsal Court",
  },

  // 2. New field halves (two independent halves)
  {
    id: "newfield-half-a",
    name: "New Field - Half A",
    type: "half_field",
    half: "A",
    location: "AUI New Field - Half A",
  },
  {
    id: "newfield-half-b",
    name: "New Field - Half B",
    type: "half_field",
    half: "B",
    location: "AUI New Field - Half B",
  },

  // 3. Tennis courts
  {
    id: "tennis-1",
    name: "Tennis Court 1",
    type: "tennis",
    location: "AUI Tennis Court 1",
  },
  {
    id: "tennis-2",
    name: "Tennis Court 2",
    type: "tennis",
    location: "AUI Tennis Court 2",
  },

  // 4. Basketball court
  {
    id: "basketball",
    name: "Basketball Court",
    type: "basketball",
    location: "AUI Basketball Court",
  },

  // 5. Padel court
  {
    id: "padel",
    name: "Padel Court",
    type: "padel",
    location: "AUI Padel Court",
  },

  // 6. Bicycles (normal + pro handled by bikeType)
  {
    id: "bicycles",
    name: "Bicycles",
    type: "bicycles",
    location: "AUI Bike Rental",
  },
];

//BOOKINGS / NOTIFICATIONS / RESET 

export const bookings = [];
let nextBookingId = 1;
export const getNextBookingId = () => nextBookingId++;

export const notifications = [];// filled by utils/email.js
export const resetTokens = [];// { token, userId, expiresAt }

// AVAILABILITY SLOTS (admin-managed)
export const availabilities = [];
let nextAvailabilityId = 1;
export const getNextAvailabilityId = () => nextAvailabilityId++;
