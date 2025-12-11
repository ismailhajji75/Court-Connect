/* --------------------------------------------------
   BOOKING STATUS TYPES
-------------------------------------------------- */

export type BookingStatus =
  | "upcoming"     // auto-confirmed free slot
  | "pending"      // requires payment or admin review
  | "approved"     // admin approved
  | "rejected"     // admin rejected
  | "cancelled"    // user cancelled
  | "past";        // date passed → auto moved

/* --------------------------------------------------
   BOOKING MODEL (UNIFIED)
-------------------------------------------------- */

export interface Booking {
  id: string;

  /* 🧑 USER INFO — Admin needs this */
  userId?: string;         // optional for now (backend later)
  userName?: string;       // admin dashboard display
  userEmail?: string;      // useful later

  /* 🏟 FACILITY INFO — you already have this */
  facilityId: string;
  facilityName: string;

  /* 📅 TIME */
  date: string;            // YYYY-MM-DD
  time: string;            // HH:mm
  duration: number;        // 1 hour default

  /* 🎒 EQUIPMENT SELECTED */
  equipment: {
    name: string;
    quantity: number;
  }[];

  /* 💰 PRICE */
  totalPrice: number;
  requiresPayment: boolean;

  /* 📌 STATUS */
  status: BookingStatus;

  /* 🕒 METADATA */
  createdAt?: string;      // ISO date (admin uses for sorting)
}
