import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

// FIXED IMPORT PATH
import { Booking } from "../types";
import { useAuth } from "./useAuth";

interface BookingsContextType {
  bookings: Booking[];
  addBooking: (
    b: Omit<Booking, "id" | "status"> & { bikeType?: string; rentalPlan?: string }
  ) => Promise<Booking | null>;
  cancelBooking: (id: string) => Promise<{ ok: boolean; message?: string }>;
  confirmBooking: (id: string) => Promise<void>;
  declineBooking: (id: string) => Promise<void>;
  refreshBookings: () => Promise<void>;
  markPastBookings: () => void;
}

const BookingsContext = createContext<BookingsContextType | null>(null);

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const { user, isAuthenticated } = useAuth();

  const API_BASE =
    (import.meta as any).env?.VITE_API_URL || "/api";

  const authHeaders = (): Record<string, string> =>
    user?.token
      ? {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        }
      : { "Content-Type": "application/json" };

  const applyPastStatus = (list: Booking[]): Booking[] => {
    const now = new Date();
    return list.map((b) => {
      // build Date from date + time (assumes local timezone)
      const start = new Date(`${b.date}T${b.time || "00:00"}:00`);
      if (
        b.status !== "cancelled" &&
        b.status !== "rejected" &&
        start.getTime() < now.getTime()
      ) {
        return { ...b, status: "past" };
      }
      return b;
    });
  };

  const mapStatus = (status: string): Booking["status"] => {
    switch (status) {
      case "PENDING":
        return "pending";
      case "CONFIRMED":
        return "upcoming";
      case "CANCELLED":
        return "cancelled";
      case "REJECTED":
        return "rejected";
      default:
        return "pending";
    }
  };

  const mapBooking = (b: any): Booking => ({
    id: String(b.id),
    userId: String(b.userId),
    userName: b.userName ?? "",
    userEmail: b.userEmail ?? "",
    facilityId: b.facilityId,
    facilityName: b.facilityName ?? b.facilityId,
    date: b.date,
    time: b.startTime,
    duration: 1,
    equipment: [],
    totalPrice: b.totalPrice ?? 0,
    requiresPayment: mapStatus(b.status) === "pending",
    status: mapStatus(b.status),
    createdAt: b.createdAt,
  });

  const refreshBookings = async () => {
    if (!isAuthenticated || !user?.token) return;
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "GET",
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      const mapped = Array.isArray(data) ? data.map(mapBooking) : [];
      // backend already scopes to current user unless admin
      setBookings(applyPastStatus(mapped as Booking[]));
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    }
  };

  // Clear and refetch when auth user changes
  useEffect(() => {
    setBookings([]);
    refreshBookings();
    const interval = setInterval(refreshBookings, 30_000); // keep bookings in sync
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.token, user?.id]);

  const addBooking = async (
    b: Omit<Booking, "id" | "status"> & { bikeType?: string; rentalPlan?: string }
  ): Promise<Booking | null> => {
    if (!user?.token) return null;
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          facilityId: b.facilityId,
          date: b.date,
          startTime: b.time,
          bikeType: b.bikeType,
          rentalPlan: b.rentalPlan,
        }),
      });

      if (!res.ok) {
        let msg = "Booking failed";
        try {
          const err = await res.json();
          msg = err?.error || msg;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      const data = await res.json();
      const created = mapBooking(data.booking ?? data);
      await refreshBookings();
      return created;
    } catch (err) {
      console.error("Create booking failed", err);
      return null;
    }
  };

  const cancelBooking = async (
    id: string
  ): Promise<{ ok: boolean; message?: string }> => {
    if (!user?.token) return { ok: false, message: "Not authenticated" };
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) {
        let msg = "Cancel booking failed";
        try {
          const err = await res.json();
          msg = err?.error || msg;
        } catch {
          /* ignore */
        }
        return { ok: false, message: msg };
      }
      await refreshBookings();
      return { ok: true };
    } catch (err) {
      console.error("Cancel booking failed", err);
      return { ok: false, message: "Cancel booking failed" };
    }
  };

  const confirmBooking = async (id: string) => {
    if (!user?.token) return;
    try {
      await fetch(`${API_BASE}/bookings/${id}/confirm`, {
        method: "POST",
        headers: authHeaders(),
      });
      await refreshBookings();
    } catch (err) {
      console.error("Confirm booking failed", err);
    }
  };

  const declineBooking = async (id: string) => {
    if (!user?.token) return;
    try {
      await fetch(`${API_BASE}/bookings/${id}/decline`, {
        method: "POST",
        headers: authHeaders(),
      });
      await refreshBookings();
    } catch (err) {
      console.error("Decline booking failed", err);
    }
  };

  const markPastBookings = () => {
    setBookings((prev) => applyPastStatus(prev as Booking[]));
  };

  return (
    <BookingsContext.Provider
      value={{
        bookings,
        addBooking,
        cancelBooking,
        confirmBooking,
        declineBooking,
        refreshBookings,
        markPastBookings,
      }}
    >
      {children}
    </BookingsContext.Provider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingsContext);
  if (!ctx)
    throw new Error("useBookings must be used inside <BookingsProvider>");
  return ctx;
}
