import React, { useState } from "react";

// ADMIN components
import { Sidebar } from "../components/Sidebar";
import { DashboardOverview } from "../components/DashboardOverview";
import { EveningBookings } from "../components/EveningBookings";
import { AvailabilityManager } from "../components/AvailabilityManager";
import { BookingsTable } from "../components/BookingsTable";

// GLOBAL hooks (shared with user)
import { useBookings } from "../../hooks/useBookings";
import { useAuth } from "../../hooks/useAuth";
import { useAvailability } from "../../hooks/useAvailability";

export function DashboardPage() {
  const { bookings, confirmBooking, declineBooking } = useBookings();
  const { user } = useAuth();
  const { refresh: refreshAvailability } = useAvailability();

  const [activeTab, setActiveTab] = useState<
    "overview" | "evening" | "availability"
  >("overview");

  /* -------------------------------------------
     ADMIN ACCESS — FIXED
  ------------------------------------------- */

  // 1) user is LOADING
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold text-gray-600">
        Loading...
      </div>
    );
  }

  // 2) user loaded but NOT admin
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-semibold text-red-600">
        Access Denied — Admins Only
      </div>
    );
  }

  /* -------------------------------------------
     ADMIN: APPROVE BOOKING  (correct status)
  ------------------------------------------- */
  const handleConfirm = (id: string) => {
    confirmBooking(id);
  };

  /* -------------------------------------------
     ADMIN: CANCEL BOOKING
  ------------------------------------------- */
  const handleCancel = (id: string) => {
    declineBooking(id);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as any)} />

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <DashboardOverview bookings={bookings} />

            {/* Confirmed bookings list for admins */}
            <BookingsTable
              bookings={bookings.filter(
                (b) => b.status === "upcoming" || b.status === "approved"
              )}
            />
          </div>
        )}

        {activeTab === "evening" && (
          <EveningBookings
            bookings={bookings}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}

        {activeTab === "availability" && (
          <AvailabilityManager />
        )}
      </main>
    </div>
  );
}
