/* ==================================================
   SHARED TYPES – UNIFIED BOOKING MODEL (USER + ADMIN)
   Fully corrected & dashboard-ready
================================================== */

/* --------------------------------------------------
   BOOKING STATUS TYPES
-------------------------------------------------- */

export type BookingStatus =
  | "upcoming"     // free slot → auto-confirmed
  | "pending"      // requires payment or admin approval
  | "approved"     // admin validated payment
  | "rejected"     // admin refused
  | "cancelled"    // user cancelled
  | "past";        // already happened

/* --------------------------------------------------
   UNIFIED BOOKING MODEL (MAIN BOOKING OBJECT)
-------------------------------------------------- */

export interface Booking {
  id: string;

  /* --------------------------
        USER INFORMATION
     -------------------------- */
  userId?: string;
  userName?: string;
  userEmail?: string;

  /* --------------------------
       FACILITY INFORMATION
     -------------------------- */
  facilityId: string;
  facilityName: string;

  /* --------------------------
       DATE & TIME
     -------------------------- */
  date: string;        // ALWAYS YYYY-MM-DD
  time: string;        // ALWAYS HH:mm
  duration: number;    // hours

  /* --------------------------
       EQUIPMENT (optional)
     -------------------------- */
  equipment: {
    name: string;
    quantity: number;
  }[];

  /* --------------------------
            PRICING
     -------------------------- */
  totalPrice: number;      // used for revenue
  requiresPayment: boolean;

  /* --------------------------
            STATUS
     -------------------------- */
  status: BookingStatus;

  /* --------------------------
            METADATA
     -------------------------- */
  createdAt?: string;     // ISO timestamp (auto-generated)
}

/* --------------------------------------------------
   AVAILABILITY (ADMIN CONTROL)
-------------------------------------------------- */

export interface Availability {
  id: string;

  facility: string;
  facilityId?: string;
  facilityLabel?: string;
  facilityType?: string;

  date: string;           // YYYY-MM-DD
  startTime: string;      // HH:mm
  endTime: string;        // HH:mm

  price: number;          // MAD per hour
  lightsAvailable: boolean;
}

/* --------------------------------------------------
   NOTIFICATION SYSTEM (Admin Bell)
-------------------------------------------------- */

export type NotificationType =
  | "booking"       // new booking created
  | "cancellation"; // booking cancelled

export interface Notification {
  id: string;

  type: NotificationType;
  message: string;

  timestamp: string;   // 🔥 FIXED: use string for localStorage compatibility
                       // Date objects cannot be stored safely → breaks parsing

  read: boolean;
}

/* --------------------------------------------------
   DASHBOARD STATISTICS (Admin Overview)
-------------------------------------------------- */

export interface DashboardStats {
  mostBooked: string;      // facility name
  todayBookings: number;   // count
  pendingRequests: number; // count
  totalRevenue: number;    // MAD
}
