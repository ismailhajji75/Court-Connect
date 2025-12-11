import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBookings } from "../hooks/useBookings";
import { toast } from "sonner";

import {
  CalendarIcon,
  ClockIcon,
  XIcon,
  PackageIcon,
  DollarSignIcon,
  RefreshCwIcon,

  Clock,
  CheckCircle,
  XCircle,
  Slash,
  History,
  CalendarCheck
} from "lucide-react";

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { bookings, cancelBooking, refreshBookings } = useBookings();

  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const selectedBookingData = bookings.find((b) => b.id === selectedBooking);

  // --------------------------
  // GROUP BOOKINGS BY STATUS
  // --------------------------
  const isHistory = (b: any) =>
    b.status === "past" || b.status === "cancelled" || b.status === "rejected";
  const visible = showHistory ? bookings : bookings.filter((b) => !isHistory(b));

  const pendingBookings = visible.filter((b) => b.status === "pending");
  const approvedBookings = visible.filter((b) => b.status === "approved");
  const upcomingBookings = visible.filter((b) => b.status === "upcoming");
  const rejectedBookings = visible.filter((b) => b.status === "rejected");

  const pastBookings = bookings.filter(isHistory);

  // --------------------------
  // CANCEL HANDLING
  // --------------------------
  const handleCancel = (id: string) => setCancellingId(id);

  const confirmCancel = async (id: string) => {
    const result = await cancelBooking(id);
    setCancellingId(null);
    setSelectedBooking(null);
    if (result.ok) {
      toast.success("Booking cancelled");
    } else {
      toast.error(
        result.message ||
          "You cannot cancel the booking within 2 hours before the start time."
      );
    }
  };

  const handleRebook = (facilityId: string) => {
    toast.info("Redirecting...");
    navigate(`/facility/${facilityId}`);
  };

  // Facility visual meta (emoji + palette)
  const facilityMeta = (name: string = "") => {
    const n = name.toLowerCase();
    if (n.includes("tennis")) return { emoji: "🎾", bg: "bg-emerald-100", text: "text-emerald-800" };
    if (n.includes("padel")) return { emoji: "🏓", bg: "bg-indigo-100", text: "text-indigo-800" };
    if (n.includes("futsal") || n.includes("soccer") || n.includes("field")) return { emoji: "⚽", bg: "bg-amber-100", text: "text-amber-800" };
    if (n.includes("basket")) return { emoji: "🏀", bg: "bg-orange-100", text: "text-orange-800" };
    if (n.includes("bicycle") || n.includes("bike")) return { emoji: "🚲", bg: "bg-sky-100", text: "text-sky-800" };
    return { emoji: "⭐", bg: "bg-gray-100", text: "text-gray-700" };
  };

  // --------------------------
  // MODERN STATUS BADGE
  // --------------------------
  const StatusBadge = ({ status }: { status: string }) => {
    const map = {
      pending: {
        label: "Pending Approval",
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="w-4 h-4" />,
      },
      approved: {
        label: "Approved",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-4 h-4" />,
      },
      rejected: {
        label: "Rejected",
        color: "bg-red-100 text-red-700",
        icon: <XCircle className="w-4 h-4" />,
      },
      cancelled: {
        label: "Cancelled",
        color: "bg-gray-200 text-gray-700",
        icon: <Slash className="w-4 h-4" />,
      },
      past: {
        label: "Past Booking",
        color: "bg-blue-100 text-blue-700",
        icon: <History className="w-4 h-4" />,
      },
      upcoming: {
        label: "Confirmed",
        color: "bg-gray-100 text-gray-800",
        icon: <CalendarCheck className="w-4 h-4" />,
      },
    };

    const s = map[status as keyof typeof map];
    if (!s) return null;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${s.color}`}
      >
        {s.icon}
        {s.label}
      </span>
    );
  };

  // --------------------------
  // BOOKING CARD COMPONENT
  // --------------------------
  const BookingCard = (booking: any, index: number) => (
    <motion.div
      key={booking.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => setSelectedBooking(booking.id)}
      className="bg-white/90 backdrop-blur rounded-3xl shadow-lg border border-emerald-50 p-6 hover:shadow-2xl transition cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-2xl ${facilityMeta(booking.facilityName).bg} ${facilityMeta(booking.facilityName).text} text-xl shadow-sm`}
          >
            {facilityMeta(booking.facilityName).emoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold" style={{ color: "#063830" }}>
                {booking.facilityName}
              </h3>
              <StatusBadge status={booking.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-gray-600">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span>{new Date(booking.date).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                <span>{booking.time} ({booking.duration}h)</span>
              </div>

              <div className="flex items-center gap-2">
                <DollarSignIcon className="w-4 h-4" />
                <span>{booking.totalPrice} MAD</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col gap-2 items-end min-w-[120px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBooking(booking.id);
            }}
            className="px-4 py-2 rounded-lg font-medium bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition"
          >
            View
          </button>

          {!["approved", "cancelled", "rejected"].includes(booking.status) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel(booking.id);
              }}
              className="px-4 py-2 rounded-lg font-medium text-white"
              style={{ backgroundColor: "#063830" }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  // --------------------------
  // PAGE RENDER
  // --------------------------
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* HEADER + HISTORY TOGGLE */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#063830" }}>My Bookings</h1>
            <p className="text-gray-600 mt-2">Manage all your bookings & requests</p>
          </div>
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur border border-emerald-100 rounded-2xl px-3 py-2 shadow-md">
            <button
              onClick={() => refreshBookings()}
              className="px-3 py-1 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition"
            >
              Refresh
            </button>
            <div className="h-5 w-px bg-emerald-100" />
            <span className="text-sm text-gray-600">
              {showHistory ? "Showing past & cancelled" : "History hidden to stay tidy"}
            </span>
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="px-3 py-1 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition"
            >
              {showHistory ? "Hide history" : "Show history"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* PENDING */}
      {pendingBookings.length > 0 && (
        <Section title="Pending Approval">
          {pendingBookings.map(BookingCard)}
        </Section>
      )}

      {/* APPROVED */}
      {approvedBookings.length > 0 && (
        <Section title="Approved Bookings">
          {approvedBookings.map(BookingCard)}
        </Section>
      )}

      {/* UPCOMING CONFIRMED */}
      <Section title="Upcoming">
        {upcomingBookings.length === 0
          ? <p className="text-gray-500">No upcoming bookings.</p>
          : upcomingBookings.map(BookingCard)}
      </Section>

      {/* REJECTED */}
      {rejectedBookings.length > 0 && (
        <Section title="Rejected Requests" color="text-red-600">
          {rejectedBookings.map(BookingCard)}
        </Section>
      )}

      {/* PAST */}
      {showHistory && pastBookings.length > 0 && (
        <Section title="Past Bookings">
          {pastBookings.map(BookingCard)}
        </Section>
      )}

      {/* DETAILS MODAL */}
      <DetailsModal
        booking={selectedBookingData}
        onClose={() => setSelectedBooking(null)}
        StatusBadge={StatusBadge}
      />

      {/* CANCEL MODAL */}
      <CancelModal
        cancellingId={cancellingId}
        onCancel={() => setCancellingId(null)}
        onConfirm={() => confirmCancel(cancellingId!)}
      />
    </div>
  );
}

/* ---------------- REUSABLE SECTION ---------------- */
const Section = ({
  title,
  color = "text-[#063830]",
  children,
}: any) => (
  <div className="mb-10">
    <h2 className={`text-xl font-bold mb-4 ${color}`}>{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

/* ---------------- DETAILS MODAL ---------------- */
const DetailsModal = ({ booking, onClose, StatusBadge }: any) => {
  if (!booking) return null;

  return (
    <AnimatePresence>
      {booking && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2
            md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg
            bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "#063830" }}>
                  Booking Details
                </h2>

                <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold" style={{ color: "#063830" }}>
                    {booking.facilityName}
                  </h3>
                  <StatusBadge status={booking.status} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-[#6CABA8]" />
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium text-[#063830]">
                        {new Date(booking.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-[#6CABA8]" />
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-medium text-[#063830]">{booking.time}</p>
                    </div>
                  </div>
                </div>

                {/* Equipment */}
                {booking.equipment.length > 0 && (
                  <div>
                    <p className="font-medium mb-1 text-[#063830]">Equipment</p>
                    {booking.equipment.map((item: any, i: number) => (
                      <p key={i} className="text-sm text-gray-600 pl-1">
                        {item.quantity}× {item.name}
                      </p>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t flex justify-between items-center">
                  <span className="text-lg font-bold text-[#063830]">Total</span>
                  <span className="text-2xl font-bold text-[#063830]">
                    {booking.totalPrice} MAD
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ---------------- CANCEL MODAL ---------------- */
const CancelModal = ({ cancellingId, onCancel, onConfirm }: any) => {
  if (!cancellingId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onCancel}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
        w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6"
      >
        <h3 className="text-xl font-bold mb-4 text-[#063830]">Cancel Booking?</h3>
        <p className="text-gray-600 mb-6">Are you sure you want to cancel this booking?</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg font-medium bg-[#D8F2ED] text-[#063830]"
          >
            Keep Booking
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-lg font-medium text-white"
            style={{ backgroundColor: "#063830" }}
          >
            Cancel Booking
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
