import React from "react";
import { motion } from "framer-motion";
import {
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  TrendingUpIcon,
} from "lucide-react";

import { Booking } from "../../types";

/**
 * DASHBOARD OVERVIEW
 * This file MUST export DashboardOverview or your app will crash.
 */
export function DashboardOverview({ bookings }: { bookings: Booking[] }) {
  const today = new Date().toISOString().split("T")[0];

  // Today’s bookings
  const todaysBookings = bookings.filter((b) => b.date === today).length;

  // Pending bookings
  const pending = bookings.filter((b) => b.status === "pending").length;

  // Revenue
  const revenue = bookings
    .filter((b) => b.status === "approved" || b.status === "upcoming")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Most booked facility
  const facilityCount: Record<string, number> = {};
  bookings.forEach((b) => {
    facilityCount[b.facilityName] = (facilityCount[b.facilityName] || 0) + 1;
  });

  const mostBooked =
    Object.entries(facilityCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "No Data";

  const stats = [
    {
      label: "Most Booked Facility",
      value: mostBooked,
      icon: TrendingUpIcon,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Today's Bookings",
      value: todaysBookings,
      icon: CalendarIcon,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Pending Requests",
      value: pending,
      icon: ClockIcon,
      color: "bg-orange-100 text-orange-600",
    },
    {
      label: "Total Revenue",
      value: `${revenue} MAD`,
      icon: DollarSignIcon,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-xl border shadow-sm"
          >
            <div className={`p-3 rounded-lg inline-flex ${stat.color}`}>
              <Icon className="w-6 h-6" />
            </div>

            <h3 className="text-2xl font-bold text-[#063830] mt-4">
              {stat.value}
            </h3>
            <p className="text-gray-600 text-sm">{stat.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
