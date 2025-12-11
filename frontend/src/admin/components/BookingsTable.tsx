import React from 'react';
import { motion } from 'framer-motion';
import { Booking } from '../types/types';

interface BookingsTableProps {
  bookings: Booking[];
}

export function BookingsTable({ bookings }: BookingsTableProps) {
  /* ---------------------------------------------------
     FIX 1: SORT LATEST FIRST (matches your screenshot)
  --------------------------------------------------- */
  const sorted = [...bookings].sort((a, b) => {
    const aTime = new Date(a.createdAt ?? `${a.date}T${a.time}`);
    const bTime = new Date(b.createdAt ?? `${b.date}T${b.time}`);
    return bTime.getTime() - aTime.getTime();
  });

  /* ---------------------------------------------------
     FIX 2: STATUS COLOR (already correct)
  --------------------------------------------------- */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'upcoming':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-orange-100 text-orange-700';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'past':
        return 'bg-gray-200 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  /* ---------------------------------------------------
     FIX 3: STATUS TEXT MAPPING
     "approved" → "confirmed" (matches your reference UI)
  --------------------------------------------------- */
  const statusDisplay = (status: string) => {
    if (status === 'approved') return 'confirmed';
    return status;
  };

  /* ---------------------------------------------------
     ICON LOGIC (same as before)
  --------------------------------------------------- */
  const getFacilityIcon = (facilityName: string) => {
    const name = facilityName.toLowerCase();
    if (name.includes('bicycle')) return '🚴';
    if (name.includes('tennis')) return '🎾';
    if (name.includes('padel')) return '🏓';
    if (name.includes('soccer')) return '⚽';
    return '🏟️';
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-emerald-50 overflow-hidden">
      <div className="p-6 border-b border-emerald-50">
        <h2 className="text-xl font-bold text-[#063830]">Latest Bookings</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Facility
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Fee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {sorted.map((booking, index) => (
              <motion.tr
                key={booking.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* USER */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {booking.userName ?? 'Unknown User'}
                  </div>
                  {booking.userEmail && (
                    <div className="text-xs text-gray-500">{booking.userEmail}</div>
                  )}
                </td>

                {/* FACILITY */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {getFacilityIcon(booking.facilityName)}
                    </span>

                    <div>
                      <div className="text-sm text-gray-900">
                        {booking.facilityName}
                      </div>

                      {booking.requiresPayment && (
                        <div className="text-xs text-orange-600">
                          💡 Requires Payment
                        </div>
                      )}

                      {booking.equipment.length > 0 && (
                        <div className="text-xs text-gray-600">
                          🎒 {booking.equipment.map(e => `${e.name} x${e.quantity}`).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* DATE */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{booking.date}</div>
                </td>

                {/* TIME */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{booking.time}</div>
                </td>

                {/* PRICE */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {booking.totalPrice === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `${booking.totalPrice} MAD`
                    )}
                  </div>
                </td>

                {/* STATUS */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {statusDisplay(booking.status)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
