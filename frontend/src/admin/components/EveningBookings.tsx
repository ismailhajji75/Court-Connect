import React, { useState } from 'react'; 
import { motion } from 'framer-motion';
import { CheckIcon, XIcon } from 'lucide-react';

// ⭐ Unified booking type
import { Booking } from '../types/types';
import { useNotifications } from '../hooks/useNotifications';

interface EveningBookingsProps {
  bookings: Booking[];
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
}

export function EveningBookings({
  bookings,
  onConfirm,
  onCancel
}: EveningBookingsProps) {
  const { addNotification } = useNotifications();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ⭐ Evening = after 5PM + pending only
  const eveningBookings = bookings.filter(b => {
    const hour = parseInt(b.time.split(':')[0], 10);
    return b.status === 'pending' && hour >= 17;
  });

  const handleConfirm = (booking: Booking) => {
    setProcessingId(booking.id);

    setTimeout(() => {
      onConfirm(booking.id);

      addNotification(
        "booking",
        `Approved booking: ${booking.userName} → ${booking.facilityName} at ${booking.time}`
      );

      setProcessingId(null);
    }, 500);
  };

  const handleCancel = (booking: Booking) => {
    setProcessingId(booking.id);

    setTimeout(() => {
      onCancel(booking.id);

      addNotification(
        "cancellation",
        `Rejected booking: ${booking.userName} → ${booking.facilityName} at ${booking.time}`
      );

      setProcessingId(null);
    }, 500);
  };

  // Icon logic
  const getFacilityIcon = (facilityName: string) => {
    const name = facilityName.toLowerCase();
    if (name.includes('bicycle')) return '🚴';
    if (name.includes('tennis')) return '🎾';
    if (name.includes('padel')) return '🏓';
    if (name.includes('soccer')) return '⚽';
    return '🏟️';
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-emerald-50">
      <div className="p-6 border-b border-emerald-50">
        <h2 className="text-xl font-bold text-[#063830]">Evening Bookings to Review</h2>
        <p className="text-sm text-gray-600 mt-1">
          Pending bookings after 5:00 PM
        </p>
      </div>

      <div className="p-6">
        {eveningBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">No pending evening bookings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {eveningBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4 hover:border-[#6CABA8] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{getFacilityIcon(booking.facilityName)}</span>

                      <h3 className="font-semibold text-[#063830]">
                        {booking.userName ?? 'Unknown User'}
                      </h3>

                      <span className="text-sm text-gray-500">•</span>

                      <span className="text-sm font-medium text-[#6CABA8]">
                        {booking.facilityName}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{booking.date}</span>
                      <span>•</span>
                      <span>{booking.time}</span>
                      <span>•</span>

                      <span className="font-medium">
                        {booking.totalPrice === 0 ? "FREE" : `${booking.totalPrice} MAD`}
                      </span>

                      {booking.requiresPayment && (
                        <>
                          <span>•</span>
                          <span className="text-xs">💡 Requires Payment</span>
                        </>
                      )}

                      {booking.equipment.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-xs text-gray-600">
                            🎒 {booking.equipment.map(e => `${e.name} x${e.quantity}`).join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => handleConfirm(booking)}
                      disabled={processingId === booking.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-[#6CABA8] text-white rounded-lg hover:bg-[#5a9a97] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Confirm
                    </motion.button>

                    <motion.button
                      onClick={() => handleCancel(booking)}
                      disabled={processingId === booking.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <XIcon className="w-4 h-4" />
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
