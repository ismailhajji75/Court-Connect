import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, TrashIcon } from 'lucide-react';

// ⭐ UPDATED → Import from unified shared types
import { Availability } from '../types/types';
import { useAvailability } from '../../hooks/useAvailability';

const FACILITIES = [
  { id: 'futsal', label: '5v5 Court (Proxy Area)', type: 'court' as const, lights: true },
  { id: 'newfield-half-a', label: 'New Soccer Field (Half-Field) - A', type: 'court' as const, lights: true },
  { id: 'newfield-half-b', label: 'New Soccer Field (Half-Field) - B', type: 'court' as const, lights: true },
  { id: 'tennis-1', label: 'Tennis Court 1', type: 'court' as const, lights: true },
  { id: 'tennis-2', label: 'Tennis Court 2', type: 'court' as const, lights: true },
  { id: 'padel', label: 'Padel Court', type: 'court' as const, lights: true },
  { id: 'basket-mini', label: 'Basketball Mini-Court (Gym Side)', type: 'court' as const, lights: false },
  { id: 'bicycles', label: 'Bicycles', type: 'bicycle' as const, lights: false },
];

export function AvailabilityManager() {
  const { availabilities, addAvailability, deleteAvailability } = useAvailability();
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    facility: '',
    facilityId: '',
    facilityType: 'court' as 'court' | 'bicycle',
    date: '',
    startTime: '',
    endTime: '',
    price: '',
    lightsAvailable: false,
  });

  const handleFacilityChange = (facilityValue: string) => {
    const facility = FACILITIES.find((f) => f.id === facilityValue);
    if (facility) {
      setFormData({
        ...formData,
        facility: facility.label,
        facilityId: facility.id,
        facilityType: facility.type,
        lightsAvailable: facility.lights,
        price: facility.type === 'bicycle' ? '10' : '',
      });
    }
  };

  const calculatePrice = () => {
    if (formData.facilityType === 'bicycle') {
      return 10;
    }

    const hour = parseInt(formData.startTime.split(':')[0]);

    if (hour >= 18) {
      return formData.facility === 'New Soccer Field (Half-Field)' ? 40 : 30;
    }

    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const calculatedPrice = calculatePrice();

    const created = await addAvailability({
      facility: formData.facility || formData.facilityId,
      facilityId: formData.facilityId || formData.facility,
      facilityLabel: formData.facility,
      facilityType: formData.facilityType,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      price: calculatedPrice,
      lightsAvailable:
        formData.lightsAvailable &&
        parseInt(formData.startTime.split(':')[0]) >= 18,
    });

    if (!created) return;

    setFormData({
      facility: '',
      facilityId: '',
      facilityType: 'court',
      date: '',
      startTime: '',
      endTime: '',
      price: '',
      lightsAvailable: false,
    });

    setShowForm(false);
  };

  const getPricePreview = () => {
    if (!formData.facility || !formData.startTime) return null;

    const price = calculatePrice();
    const hour = parseInt(formData.startTime.split(':')[0]);

    if (formData.facilityType === 'bicycle') {
      return (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            🚴 Bicycles: <strong>10 MAD/hour</strong> (always requires confirmation)
          </p>
        </div>
      );
    }

    if (hour >= 18) {
      return (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            💡 Evening booking (after 6pm): <strong>{price} MAD</strong> (lights fee)
          </p>
        </div>
      );
    }

    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          ☀️ Daytime booking: <strong>FREE</strong>
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pricing Info Banner */}
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-emerald-50 p-6">
        <h3 className="font-semibold text-[#063830] mb-3">📋 Pricing Rules</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900 mb-1">☀️ Daytime (before 6pm)</p>
            <p className="text-gray-600">
              All courts: <strong>FREE</strong>
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900 mb-1">💡 Evening (after 6pm)</p>
            <p className="text-gray-600">
              Courts: <strong>30 MAD</strong> • Soccer: <strong>40 MAD</strong>
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg col-span-1 md:col-span-2">
            <p className="font-medium text-gray-900 mb-1">🚴 Bicycles</p>
            <p className="text-gray-600">
              <strong>10 MAD/hour</strong> (anytime, always requires confirmation)
            </p>
          </div>
        </div>
      </div>

      {/* Add Availability Form Toggle */}
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-emerald-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#063830]">Manage Availability</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add or remove facility availability slots
            </p>
          </div>

          <motion.button
            onClick={() => setShowForm(!showForm)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-[#6CABA8] text-white rounded-lg hover:bg-[#5a9a97] transition-colors flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Availability
          </motion.button>
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit}
            className="mt-6 p-6 bg-gray-50 rounded-lg space-y-4 shadow-inner"
            >
              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* Facility */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#063830] mb-2">
                    Facility
                  </label>

                  <select
                    value={formData.facilityId}
                    onChange={(e) => handleFacilityChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#6CABA8] focus:outline-none"
                    required
                  >
                    <option value="">Select facility</option>

                    <optgroup label="Courts">
                      {FACILITIES.filter((f) => f.type === 'court').map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="Equipment">
                      {FACILITIES.filter((f) => f.type === 'bicycle').map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-[#063830] mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#6CABA8] focus:outline-none"
                    required
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm font-medium text-[#063830] mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#6CABA8] focus:outline-none"
                    required
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-medium text-[#063830] mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#6CABA8] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Price Preview */}
              {getPricePreview()}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#063830] text-white rounded-lg hover:bg-[#0a4d42] transition-colors"
                >
                  Add Slot
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Availability List */}
      <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-emerald-50">
        <div className="p-6">
          <h3 className="font-semibold text-[#063830] mb-4">Current Availability</h3>

          <div className="space-y-3">
            {availabilities.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No availability slots yet
              </p>
            ) : (
              availabilities.map((availability, index) => (
                <motion.div
                  key={availability.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-[#6CABA8] transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-[#063830]">
                        {availability.facility}
                      </span>

                      {availability.facilityType && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {availability.facilityType}
                        </span>
                      )}

                      {availability.lightsAvailable && (
                        <span className="text-xs text-orange-600">💡 Evening</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{availability.date}</span>
                      <span>•</span>
                      <span>
                        {availability.startTime} - {availability.endTime}
                      </span>
                      <span>•</span>

                      <span className="font-medium text-[#6CABA8]">
                        {availability.price === 0
                          ? 'FREE'
                          : `${availability.price} MAD`}
                      </span>
                    </div>
                  </div>

                  <motion.button
                  onClick={() => deleteAvailability(availability.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
