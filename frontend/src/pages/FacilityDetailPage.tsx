import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { facilities, generateTimeSlots, calculatePrice } from "../utils/facilities";
import { useBookings } from "../hooks/useBookings";
import { useAuth } from "../hooks/useAuth";
import { useAvailability } from "../hooks/useAvailability";
import { toast } from "sonner";

import {
  CalendarIcon,
  ClockIcon,
  ArrowLeftIcon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";

export default function FacilityDetailPage() {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const { addBooking, bookings } = useBookings();
  const { user } = useAuth();
  const { availabilities } = useAvailability();

  const facility = facilities.find((f) => f.id === facilityId);

  // Tennis + soccer: allow switching between sub-courts/halves on the same page
  const tennisCourts = useMemo(
    () => facilities.filter((f) => f.type === "tennis"),
    []
  );
  const soccerHalves = useMemo(
    () => facilities.filter((f) => f.type === "soccer"),
    []
  );

  const [selectedCourtId, setSelectedCourtId] = useState<string>(
    facility?.type === "tennis" || facility?.type === "soccer"
      ? facility.id
      : facility?.id ?? ""
  );

  const currentFacility =
    facility?.type === "tennis"
      ? tennisCourts.find((court) => court.id === selectedCourtId) ?? facility
      : facility?.type === "soccer"
      ? soccerHalves.find((half) => half.id === selectedCourtId) ?? facility
      : facility;

  const displayName =
    facility?.type === "tennis"
      ? "Tennis Court"
      : facility?.type === "soccer"
      ? "New Soccer Field"
      : currentFacility?.name;

  const selectedCourtLabel =
    currentFacility?.type === "tennis"
      ? currentFacility.id?.endsWith("-1")
        ? "Court 1"
        : currentFacility.id?.endsWith("-2")
        ? "Court 2"
        : currentFacility.name
      : currentFacility?.type === "soccer"
      ? currentFacility.id?.endsWith("-a")
        ? "Field A"
        : currentFacility.id?.endsWith("-b")
        ? "Field B"
        : currentFacility.name
      : currentFacility?.name;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [equipment, setEquipment] = useState<Record<string, number>>({});
  const [showEquipment, setShowEquipment] = useState(false);

  // 🔥 New state for bicycles
  const [bikeType, setBikeType] = useState<"normal" | "pro">("normal");
  const [rentalPlan, setRentalPlan] =
    useState<"2h" | "daily" | "3d" | "weekly" | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [takenSlots, setTakenSlots] = useState<{ startTime: string; endTime: string }[]>([]);

  if (!facility || !currentFacility) {
    return <div className="p-8 text-center text-red-500">Facility not found.</div>;
  }

  // Expand availability windows into 1-hour start times (inclusive start, exclusive end)
  const expandAvailabilitySlots = () => {
    const slots: string[] = [];
    const day = selectedDate.toLocaleDateString("en-CA");
    const matches = availabilities.filter(
      (a) =>
        ((a.facilityId && a.facilityId === currentFacility.id) ||
          a.facility === currentFacility.id ||
          a.facility === currentFacility.name ||
          a.facilityLabel === currentFacility.name) &&
        a.date === day
    );

    matches.forEach((a) => {
      const [sh, sm] = a.startTime.split(":").map(Number);
      const [eh, em] = a.endTime.split(":").map(Number);
      const startMinutes = sh * 60 + (sm || 0);
      const endMinutes = eh * 60 + (em || 0);

      for (let m = startMinutes; m + 60 <= endMinutes; m += 60) {
        const h = Math.floor(m / 60)
          .toString()
          .padStart(2, "0");
        const mm = (m % 60).toString().padStart(2, "0");
        slots.push(`${h}:${mm}`);
      }
    });

    return slots;
  };

  const availabilitySlots = expandAvailabilitySlots();

  // Combine default schedule with admin-provided slots (per facility/date), de-duplicated and time-sorted
  const baseSlots = generateTimeSlots(currentFacility.id, selectedDate);
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const timeSlots = Array.from(new Set([...baseSlots, ...availabilitySlots])).sort(
    (a, b) => toMinutes(a) - toMinutes(b)
  );

  // Base price (lights) for non-bicycles
  const basePrice = selectedTime
    ? calculatePrice(currentFacility.id, selectedTime, [])
    : 0;

  // 🛞 Special pricing for bicycles based on type + rental plan
  const getBicyclePrice = () => {
    if (currentFacility.type !== "bicycles" || !rentalPlan) return 0;

    if (bikeType === "normal") {
      switch (rentalPlan) {
        case "2h":
          return 20;
        case "daily":
          return 50;
        case "3d":
          return 130;
        case "weekly":
          return 200;
      }
    } else {
      // professional bike
      switch (rentalPlan) {
        case "2h":
          return 40;
        case "daily":
          return 80;
        case "3d":
          return 170;
        case "weekly":
          return 400;
      }
    }
  };

  const bicyclePrice = getBicyclePrice();
  const price = currentFacility.type === "bicycles" ? bicyclePrice : basePrice;

  // Morocco current time helper
  const moroccoNow = () =>
    new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Casablanca" }));

  const isSlotInPast = (slot: string) => {
    const now = moroccoNow();
    const slotDate = new Date(selectedDate);
    const [h, m] = slot.split(":").map(Number);
    slotDate.setHours(h, m ?? 0, 0, 0);

    const sameDay =
      slotDate.getFullYear() === now.getFullYear() &&
      slotDate.getMonth() === now.getMonth() &&
      slotDate.getDate() === now.getDate();

    return sameDay && slotDate <= now;
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowEquipment(true);
  };

  const updateEquipment = (itemId: string, delta: number) => {
    const item = currentFacility.availableEquipment.find((e) => e.id === itemId);
    if (!item) return;

    const current = equipment[itemId] || 0;
    const updated = Math.max(0, Math.min(item.quantity, current + delta));
    setEquipment((prev) => ({ ...prev, [itemId]: updated }));
  };

  // -------------------------
  // BOOKING LOGIC
  // -------------------------
  const handleBooking = async () => {
    if (!selectedTime) return;

    // Extra guard for bicycles: must select rental plan
    if (currentFacility.type === "bicycles" && !rentalPlan) {
      toast.error("Please choose a rental duration for the bicycle.");
      return;
    }

    // Selected (optional) equipment with quantities
    const selectedEquipment = Object.entries(equipment)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = currentFacility.availableEquipment.find((e) => e.id === id);
        return { name: item?.name || "", quantity: qty };
      });

    // Add included equipment info (1x each)
    currentFacility.includedEquipment.forEach((name) => {
      selectedEquipment.push({ name, quantity: 1 });
    });

    const requiresPayment = price > 0;

    const created = await addBooking({
      facilityId: currentFacility.id,
      facilityName: currentFacility.name,
      date: selectedDate.toLocaleDateString("en-CA"),
      time: selectedTime,
      duration: 1,
      equipment: selectedEquipment,
      totalPrice: price,
      requiresPayment,
      bikeType: currentFacility.type === "bicycles" ? bikeType : undefined,
      rentalPlan: currentFacility.type === "bicycles" ? rentalPlan ?? undefined : undefined,
    });

    if (!created) {
      toast.error("Booking failed. Please try again or pick another slot.");
      return;
    }

    toast.success(
      requiresPayment
        ? "Booking request sent — waiting admin approval."
        : "Booking confirmed!",
      {
        description: `${currentFacility.name} • ${selectedDate.toLocaleDateString()} at ${selectedTime}`,
      }
    );

    navigate("/bookings");
  };

  // Fetch availability for selected date so users can't pick taken slots
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const fetchAvailability = async () => {
      if (!user?.token || !currentFacility?.id) return;
      const API_BASE = (import.meta as any).env?.VITE_API_URL || "/api";
      try {
        const res = await fetch(
          `${API_BASE}/bookings/availability/${currentFacility.id}?date=${selectedDate.toLocaleDateString("en-CA")}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        setTakenSlots(data.slots || []);
      } catch (err) {
        console.error("Failed to load availability", err);
      }
    };
    fetchAvailability();
    interval = setInterval(fetchAvailability, 30_000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentFacility?.id, selectedDate, user?.token, bookings]);

  const isSlotTaken = (slot: string) => {
    // slot is start time (HH:mm) for a 1-hour window
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const s = toMinutes(slot);
    const e = s + 60;
    return takenSlots.some((b) => {
      const bs = toMinutes(b.startTime);
      const be = toMinutes(b.endTime);
      return s < be && e > bs;
    });
  };

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate("/home")}
        className="flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Facilities
      </button>

      {/* TITLE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#063830" }}>
          {displayName}
        </h1>
        <p className="text-gray-600">{currentFacility.description}</p>

        {/* Tennis courts: toggle Court 1 / Court 2 and show availability per court */}
        {currentFacility.type === "tennis" && (
          <div className="mt-4 flex flex-wrap gap-3">
            {tennisCourts.map((court) => (
              <button
                key={court.id}
                onClick={() => {
                  setSelectedCourtId(court.id);
                  setSelectedTime("");
                  setShowEquipment(false);
                  setTakenSlots([]);
                }}
                className="px-4 py-2 rounded-lg border font-medium"
                style={{
                  backgroundColor:
                    court.id === selectedCourtId ? "#063830" : "white",
                  color: court.id === selectedCourtId ? "white" : "#063830",
                  borderColor:
                    court.id === selectedCourtId ? "#063830" : "#6CABA8",
                }}
              >
                {court.id.endsWith("-1")
                  ? "Court 1"
                  : court.id.endsWith("-2")
                  ? "Court 2"
                  : court.name}
              </button>
            ))}
          </div>
        )}

        {/* Soccer halves: toggle Field A / Field B and show availability per half */}
        {currentFacility.type === "soccer" && (
          <div className="mt-4 flex flex-wrap gap-3">
            {soccerHalves.map((half) => (
              <button
                key={half.id}
                onClick={() => {
                  setSelectedCourtId(half.id);
                  setSelectedTime("");
                  setShowEquipment(false);
                  setTakenSlots([]);
                }}
                className="px-4 py-2 rounded-lg border font-medium"
                style={{
                  backgroundColor:
                    half.id === selectedCourtId ? "#063830" : "white",
                  color: half.id === selectedCourtId ? "white" : "#063830",
                  borderColor:
                    half.id === selectedCourtId ? "#063830" : "#6CABA8",
                }}
              >
                {half.id?.endsWith("-a")
                  ? "Field A"
                  : half.id?.endsWith("-b")
                  ? "Field B"
                  : half.name}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* IMAGE */}
      {currentFacility.image && (
        <img
          src={currentFacility.image}
          alt={displayName || currentFacility.name}
          className="w-full h-64 object-cover rounded-xl shadow-md mb-6"
        />
      )}

      {/* 🔁 TWO MODES:
          - bookingRequired = false  → walk-in info (e.g. Basketball)
          - bookingRequired = true   → normal booking flow
      */}

      {!currentFacility.bookingRequired ? (
        /* ---------------- WALK-IN ONLY LAYOUT (Basketball) ---------------- */
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Operating hours + equipment text */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-[#063830] mb-2">
                  Operating Hours
                </h2>
                <p className="text-sm text-gray-700">
                  Mon–Fri: {currentFacility.hours.weekday}
                  <br />
                  Sat–Sun: {currentFacility.hours.weekend}
                </p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#063830] mb-2">
                  Equipment
                </h2>
                {currentFacility.type === "basketball" ? (
                  <p className="text-sm text-gray-700">
                    Bring your own equipment.
                    <br />
                    Free basketball rental available on-site.
                  </p>
                ) : (
                  <p className="text-sm text-gray-700">
                    Equipment available on-site.
                  </p>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-[#063830] mb-2">
                  Important Notes
                </h2>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {currentFacility.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Walk-in callout */}
            <div className="flex flex-col justify-center">
              <div className="bg-[#D8F2ED] rounded-xl p-6 text-center mb-4">
                <h2 className="text-xl font-bold text-[#063830] mb-2">
                  Walk-In Only
                </h2>
                <p className="text-sm text-gray-700">
                  No booking required. First-come, first-served.
                  <br />
                  Free equipment rental available on-site.
                </p>
              </div>
              {currentFacility.capacity && (
                <p className="text-sm text-gray-600 text-center">
                  Capacity: First-come, first-served (approx. {currentFacility.capacity} people)
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ---------------- NORMAL BOOKING FLOW ---------------- */
        <>
          {/* DATE PICKER */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5" style={{ color: "#6CABA8" }} />
              <h2 className="text-xl font-bold" style={{ color: "#063830" }}>
                Select Date
              </h2>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {dates.map((date) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: isSelected ? "#063830" : "white",
                      color: isSelected ? "white" : "#063830",
                      border: `2px solid ${isSelected ? "#063830" : "#6CABA8"}`,
                    }}
                  >
                    <div className="text-xs font-medium">
                      {date.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div className="text-lg font-bold">{date.getDate()}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TIME SLOTS */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <ClockIcon className="w-5 h-5" style={{ color: "#6CABA8" }} />
              <h2 className="text-xl font-bold" style={{ color: "#063830" }}>
                Select Time
              </h2>
              {(currentFacility.type === "tennis" || currentFacility.type === "soccer") && (
                <span className="text-xs text-gray-500">
                  Showing {selectedCourtLabel}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {timeSlots.map((time) => {
                const isSelected = selectedTime === time;
                const taken = isSlotTaken(time);
                const past = isSlotInPast(time);
                const hour = parseInt(time.split(":")[0]);
                const lightingHour = parseInt(currentFacility.lightingStartTime.split(":")[0]);
                const extraFee =
                  currentFacility.type === "bicycles"
                    ? null
                    : hour >= lightingHour && currentFacility.lightingFee > 0
                    ? currentFacility.lightingFee
                    : null;

                return (
                  <button
                    key={time}
                    onClick={() => handleTimeSelect(time)}
                    disabled={taken || past}
                    className="flex flex-col items-center justify-center p-3 rounded-lg"
                    style={{
                      backgroundColor: taken
                        ? "#F3F4F6"
                        : past
                        ? "#F3F4F6"
                        : isSelected
                        ? "#063830"
                        : "white",
                      color:
                        taken || past ? "#9CA3AF" : isSelected ? "white" : "#063830",
                      border: `2px solid ${
                        taken || past ? "#E5E7EB" : isSelected ? "#063830" : "#6CABA8"
                      }`,
                      height: "70px",
                    }}
                  >
                    <span className="font-semibold">{time}</span>
                    {(taken || past) && (
                      <span className="text-xs text-red-500 font-medium">
                        {taken ? "Booked" : "Past"}
                      </span>
                    )}

                    {extraFee && (
                      <span
                        className="text-xs font-medium"
                        style={{ color: isSelected ? "#D8F2ED" : "#6CABA8" }}
                      >
                        +{extraFee} MAD
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* EQUIPMENT SELECTION (after time is chosen) */}
          {showEquipment && selectedTime && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold mb-4" style={{ color: "#063830" }}>
                Equipment
              </h2>

              {/* Included equipment */}
              {currentFacility.includedEquipment.length > 0 && (
                <div className="mb-4">
                  {currentFacility.includedEquipment.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#D8F2ED] mb-2"
                    >
                      <div>
                        <p className="font-medium text-[#063830]">{name}</p>
                        <p className="text-xs text-gray-600">Included</p>
                      </div>
                      <span className="text-xs font-semibold text-[#063830]">
                        1x
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Optional / stock-limited equipment */}
              {currentFacility.availableEquipment.length > 0 && (
                <div className="space-y-3">
                  {currentFacility.availableEquipment.map((item) => {
                    const selectedQty = equipment[item.id] || 0;
                    const remaining = item.quantity - selectedQty;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-[#063830]">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.included
                              ? "Free rental • stock limited"
                              : "Optional equipment"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Available: {remaining}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateEquipment(item.id, -1)}
                            disabled={selectedQty === 0}
                            className="p-2 rounded-full border disabled:opacity-40"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">
                            {selectedQty}
                          </span>
                          <button
                            onClick={() => updateEquipment(item.id, 1)}
                            disabled={selectedQty >= item.quantity}
                            className="p-2 rounded-full border disabled:opacity-40"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* BOOKING SUMMARY */}
          {selectedTime && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2
                className="text-xl font-bold mb-4"
                style={{ color: "#063830" }}
              >
                Booking Summary
              </h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Facility</span>
                  <span className="font-medium">
                    {currentFacility.type === "tennis" || currentFacility.type === "soccer"
                      ? `${displayName} – ${selectedCourtLabel}`
                      : displayName}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">
                    {selectedDate.toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Time</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>

                {/* 🛞 Extra options only for bicycles */}
                {currentFacility.type === "bicycles" && (
                  <>
                    {/* Bike type */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Bike Type</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setBikeType("normal")}
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor:
                              bikeType === "normal" ? "#063830" : "#D8F2ED",
                            color: bikeType === "normal" ? "white" : "#063830",
                          }}
                        >
                          Normal
                        </button>
                        <button
                          onClick={() => setBikeType("pro")}
                          className="px-3 py-1 rounded-full text-sm font-medium"
                          style={{
                            backgroundColor:
                              bikeType === "pro" ? "#063830" : "#D8F2ED",
                            color: bikeType === "pro" ? "white" : "#063830",
                          }}
                        >
                          Professional
                        </button>
                      </div>
                    </div>

                    {/* Rental plan via modal */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Rental Duration</span>
                      <button
                        onClick={() => setShowPlanModal(true)}
                        className="px-3 py-1 rounded-lg text-sm font-medium"
                        style={{ backgroundColor: "#D8F2ED", color: "#063830" }}
                      >
                        {rentalPlan
                          ? (() => {
                              switch (rentalPlan) {
                                case "2h":
                                  return "2 Hours";
                                case "daily":
                                  return "Daily";
                                case "3d":
                                  return "3 Days";
                                case "weekly":
                                  return "Weekly";
                              }
                            })()
                          : "Choose Plan"}
                      </button>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Total</span>
                  <span>{price} MAD</span>
                </div>
              </div>

              <button
                onClick={handleBooking}
                className="w-full py-4 rounded-lg mt-2 text-white"
                style={{ backgroundColor: "#063830" }}
              >
                {price > 0 ? "Send Booking Request" : "Confirm Booking"}
              </button>
            </motion.div>
          )}
        </>
      )}

      {/* RENTAL PLAN MODAL (bicycles only) */}
      <AnimatePresence>
        {currentFacility.type === "bicycles" && showPlanModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowPlanModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                         w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6"
            >
              <h3
                className="text-xl font-bold mb-4"
                style={{ color: "#063830" }}
              >
                Choose Rental Plan
              </h3>

              <div className="space-y-3">
                {[
                  { key: "2h", label: "2 Hours", normal: 20, pro: 40 },
                  { key: "daily", label: "Daily", normal: 50, pro: 80 },
                  { key: "3d", label: "3 Days", normal: 130, pro: 170 },
                  { key: "weekly", label: "Weekly", normal: 200, pro: 400 },
                ].map((plan) => (
                  <button
                    key={plan.key}
                    onClick={() => {
                      setRentalPlan(plan.key as any);
                      setShowPlanModal(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl border hover:shadow-md transition-all"
                    style={{
                      borderColor:
                        rentalPlan === plan.key ? "#063830" : "#E5E7EB",
                      backgroundColor:
                        rentalPlan === plan.key ? "#D8F2ED" : "white",
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium" style={{ color: "#063830" }}>
                        {plan.label}
                      </span>
                      <span className="text-sm text-gray-600">
                        Normal: {plan.normal} DH • Pro: {plan.pro} DH
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
