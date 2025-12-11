import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { facilities } from "../utils/facilities";
import {
  BikeIcon,
  ClockIcon,
  ZapIcon,
  PackageIcon,
  BoxIcon,
} from "lucide-react";
import WeatherTimeWidget from "../components/WeatherTimeWidget";
import { useAvailability } from "../hooks/useAvailability";

const facilityIcons = {
  tennis: BoxIcon,
  padel: BoxIcon,
  soccer: BoxIcon,
  futsal: BoxIcon,
  basketball: BoxIcon,
  bicycles: BikeIcon,
};

export default function HomePage() {
  const navigate = useNavigate();
  const { availabilities, refresh } = useAvailability();
  const [activeTab, setActiveTab] = useState<string>("tennis");

  const activeFacility = facilities.find((f) => f.type === activeTab);
  const tennisCourts = facilities.filter((f) => f.type === "tennis");
  const soccerHalves = facilities.filter((f) => f.type === "soccer");
  const activeTitle =
    activeFacility?.type === "tennis" ? "Tennis Court" : activeFacility?.name;

  const tabs = [
    { id: "tennis", label: "Tennis" },
    { id: "padel", label: "Padel" },
    { id: "soccer", label: "Soccer" },
    { id: "futsal", label: "Futsal" },
    { id: "basketball", label: "Basketball" },
    { id: "bicycles", label: "Bicycles" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      style={{
        borderRadius: "32px",
        background:
          "radial-gradient(140% 140% at 15% 20%, rgba(6,56,48,0.12), transparent 45%), radial-gradient(120% 120% at 85% 0%, rgba(15,118,110,0.1), transparent 40%), linear-gradient(180deg, rgba(216,242,237,0.8) 0%, rgba(216,242,237,0.5) 60%, rgba(255,255,255,0.6) 100%)",
      }}
    >
      {/* floating accents */}
      <div className="absolute -z-10 inset-0 pointer-events-none">
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-emerald-200 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-20 right-0 w-56 h-56 bg-teal-200 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl opacity-40" />
      </div>

      {/* ---------------- LIVE INFO ---------------- */}
      <div className="mb-10">
        <div className="rounded-3xl shadow-xl border border-emerald-50 bg-white/80 backdrop-blur">
          <WeatherTimeWidget />
        </div>
      </div>

      {/* ---------------- HERO ---------------- */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-800 text-sm font-medium shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live campus booking
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold" style={{ color: "#063830" }}>
          Your Game, One Tap Away
        </h1>
        <p className="text-lg sm:text-xl text-[#0f766e]">
          Book your favorite sports facilities on campus
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate("/bookings")}
            className="px-5 py-3 rounded-xl text-sm font-semibold bg-[#063830] text-white shadow-lg hover:translate-y-[-1px] transition"
          >
            View my bookings
          </button>
        </div>
      </motion.div>

      {/* ---------------- TABS ---------------- */}
      <div className="mb-8">
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = facilityIcons[tab.id as keyof typeof facilityIcons];

            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="relative flex items-center gap-3 px-7 py-3 rounded-xl font-semibold whitespace-nowrap transition-all shadow-md"
                style={{
                  color: isActive ? "#063830" : "#0f766e",
                  backgroundColor: isActive ? "#d8f2ed" : "white",
                }}
              >
                {/* Background glow (behind content) */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute inset-0 rounded-xl border border-emerald-200"
                    style={{ backgroundColor: "#e8f9f5", zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 250, damping: 20 }}
                  />
                )}

                <Icon className="w-6 h-6" />
                {tab.label}
                {isActive && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-emerald-500" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ---------------- FACILITY CARD ---------------- */}
      <AnimatePresence mode="wait">
        {activeFacility && (
          <motion.div
            id="facility-spotlight"
            key={activeFacility.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.005, transition: { duration: 0.25 } }}
            className="bg-white rounded-3xl shadow-2xl p-8 border border-emerald-50"
          >
            <div className="grid md:grid-cols-2 gap-8">
              {/* LEFT SIDE */}
              <div>
                <h2 className="text-3xl font-bold mb-4" style={{ color: "#063830" }}>
                  {activeTitle}
                </h2>

                <p className="text-gray-600 mb-6">{activeFacility.description}</p>

                {/* HOURS */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <ClockIcon className="w-5 h-5 mt-1" style={{ color: "#6CABA8" }} />
                    <div>
                      <p className="font-medium" style={{ color: "#063830" }}>Operating Hours</p>
                      <p className="text-sm text-gray-600">{activeFacility.hours.weekday}</p>
                      <p className="text-sm text-gray-600">{activeFacility.hours.weekend}</p>
                    </div>
                  </div>

                  {activeFacility.lightingFee > 0 && (
                    <div className="flex items-start gap-3">
                      <ZapIcon className="w-5 h-5 mt-1" style={{ color: "#6CABA8" }} />
                      <div>
                        <p className="font-medium" style={{ color: "#063830" }}>Lighting Fee</p>
                        <p className="text-sm text-gray-600">
                          {activeFacility.lightingFee} MAD/hour after {activeFacility.lightingStartTime}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <PackageIcon className="w-5 h-5 mt-1" style={{ color: "#6CABA8" }} />
                    <div>
                      <p className="font-medium" style={{ color: "#063830" }}>Equipment</p>

                      {activeFacility.includedEquipment.length > 0 ? (
                        <p className="text-sm text-gray-600">
                          Included: {activeFacility.includedEquipment.join(", ")}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600">Bring your own equipment</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* NOTES */}
                {activeFacility.notes.length > 0 && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: "#D8F2ED" }}>
                    <p className="font-medium mb-2" style={{ color: "#063830" }}>Important Notes:</p>
                    <ul className="space-y-1">
                      {activeFacility.notes.map((n, i) => (
                        <li key={i} className="text-sm text-gray-700">• {n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* RIGHT SIDE */}
              <div className="flex flex-col justify-center items-center">
                {activeFacility.image && (
                  <motion.img
                    src={activeFacility.image}
                    alt={activeTitle || activeFacility.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full rounded-2xl mb-6 shadow-xl object-cover"
                    style={{ maxHeight: "260px" }}
                  />
                )}

                {activeFacility.bookingRequired && !["tennis", "soccer"].includes(activeFacility.type) ? (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/facility/${activeFacility.id}`)}
                    className="w-full py-4 rounded-lg text-white font-medium text-lg transition-all hover:opacity-90"
                    style={{ backgroundColor: "#063830" }}
                  >
                    Book Now
                  </motion.button>
                ) : !activeFacility.bookingRequired ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-6 rounded-lg"
                    style={{ backgroundColor: "#D8F2ED" }}
                  >
                    <p className="text-lg font-medium mb-2" style={{ color: "#063830" }}>
                      Walk-In Only
                    </p>
                    <p className="text-gray-600">No booking required. First-come, first-served.</p>
                  </motion.div>
                ) : null}

                {activeFacility.type === "tennis" ? (
                  <div className="flex gap-3 mt-4 w-full">
                    {tennisCourts.map((court) => (
                      <button
                        key={court.id}
                        onClick={() => navigate(`/facility/${court.id}`)}
                        className="flex-1 py-3 rounded-lg text-white font-medium text-sm"
                        style={{ backgroundColor: "#063830" }}
                      >
                        {court.id.endsWith("-1")
                          ? "Court 1"
                          : court.id.endsWith("-2")
                          ? "Court 2"
                          : court.name}
                      </button>
                    ))}
                  </div>
                ) : activeFacility.type === "soccer" ? (
                  <div className="flex gap-3 mt-4 w-full">
                    {soccerHalves.map((half) => (
                      <button
                        key={half.id}
                        onClick={() => navigate(`/facility/${half.id}`)}
                        className="flex-1 py-3 rounded-lg text-white font-medium text-sm"
                        style={{ backgroundColor: "#063830" }}
                      >
                        {half.id.endsWith("-a")
                          ? "Field A"
                          : half.id.endsWith("-b")
                          ? "Field B"
                          : half.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  activeFacility.capacity && (
                    <p className="text-center text-sm text-gray-500 mt-4">
                      Capacity: {activeFacility.capacity}
                    </p>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </motion.div>
  );
}
