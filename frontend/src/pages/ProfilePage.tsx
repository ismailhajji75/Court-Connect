import React from "react";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { UserIcon, LogOutIcon } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 left-4 w-40 h-40 bg-emerald-200 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 right-4 w-48 h-48 bg-teal-200 rounded-full blur-3xl opacity-40" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 border border-emerald-50 relative z-10"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden shadow-lg"
            style={{ backgroundColor: "#D8F2ED" }}
          >
            <UserIcon className="w-16 h-16" style={{ color: "#6CABA8" }} />
          </div>
          <p className="text-sm text-gray-500 mt-3">Profile overview</p>
        </div>

        {/* User Info */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#063830" }}>
              Username
            </label>
            <div
              className="w-full px-4 py-3 rounded-xl shadow-sm"
              style={{ backgroundColor: "#f4fbf9", color: "#063830", border: "1px solid #d6f0e8" }}
            >
              {user.username}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#063830" }}>
              Email
            </label>
            <div
              className="w-full px-4 py-3 rounded-xl shadow-sm"
              style={{ backgroundColor: "#f4fbf9", color: "#063830", border: "1px solid #d6f0e8" }}
            >
              {user.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#063830" }}>
              Role
            </label>
            <div
              className="w-full px-4 py-3 rounded-xl shadow-sm"
              style={{ backgroundColor: "#f4fbf9", color: "#063830", border: "1px solid #d6f0e8" }}
            >
              {user.role}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-all hover:shadow-xl"
          style={{ background: "linear-gradient(120deg,#063830,#0f766e)" }}
        >
          <LogOutIcon className="w-5 h-5" />
          Log Out
        </button>
      </motion.div>
    </div>
  );
}
