import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { LogInIcon, MailIcon, LockIcon } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const loggedInUser = await login(email, password);

    if (!loggedInUser) {
      setError("Invalid credentials. Use your AUI email and password.");
      setLoading(false);
      return;
    }

    // admins/superadmins land on dashboard, others to home
    if (loggedInUser.role === "ADMIN" || loggedInUser.role === "SUPERADMIN") {
      navigate("/admin/dashboard");
    } else {
      navigate("/home");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(145deg, #d8f2ed 0%, #f5fffb 40%, #e2fbf4 100%)" }}
    >
      {/* floating accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 left-6 w-48 h-48 bg-emerald-200 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-24 right-12 w-64 h-64 bg-teal-200 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-10 left-16 w-56 h-56 bg-white rounded-full blur-3xl opacity-30" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 border border-emerald-50">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src="/cc.jpg" alt="CourtConnect Logo" className="h-24 w-auto rounded-xl shadow-md" />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#063830" }}>
              Welcome Back
            </h1>
            <p className="text-gray-600">Sign in to book your facilities</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#063830" }}>
                Email
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="f.lastname@aui.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none shadow-sm"
                  style={{ borderColor: "#c7eee7", backgroundColor: "#f9fdfc" }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#063830" }}>
                Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none shadow-sm"
                  style={{ borderColor: "#c7eee7", backgroundColor: "#f9fdfc" }}
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-600 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 transition"
              style={{ background: "linear-gradient(120deg,#063830,#0f766e)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogInIcon className="w-5 h-5" />
                  Sign In
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Use AUI login
          </p>
        </div>
      </motion.div>
    </div>
  );
}
