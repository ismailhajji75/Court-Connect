// src/admin/AdminDashboard.tsx
import React from "react";
import { NotificationProvider } from "./hooks/useNotifications";
import { DashboardPage } from "./pages/DashboardPage";

export default function AdminDashboard() {
  return (
    <NotificationProvider>
      <DashboardPage />
    </NotificationProvider>
  );
}
