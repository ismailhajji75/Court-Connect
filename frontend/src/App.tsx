import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Header from "./components/Header";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import FacilityDetailPage from "./pages/FacilityDetailPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import ProfilePage from "./pages/ProfilePage";

import AdminDashboard from "./admin/AdminDashboard";
import ChatBot from "./components/ChatBot";

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideHeader = location.pathname.startsWith("/admin");
  return (
    <>
      {!hideHeader && <Header />}
      {children}
      {!hideHeader && <ChatBot />}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>

          {/* Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* USER ROUTES */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/facility/:facilityId" element={<FacilityDetailPage />} />
          <Route path="/bookings" element={<MyBookingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* ADMIN ROUTE */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

        </Routes>
      </Layout>
    </Router>
  );
}
