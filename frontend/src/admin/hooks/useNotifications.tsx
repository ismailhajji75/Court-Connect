// src/admin/hooks/useNotifications.tsx

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Notification, NotificationType } from "../types/types";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (type: NotificationType, message: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const STORAGE_KEY = "courtconnect-notifications";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /* ---------------------------------------------------
       LOAD FROM LOCAL STORAGE ON FIRST RENDER
  --------------------------------------------------- */
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch {
        console.error("Failed to parse notifications");
      }
    }
  }, []);

  /* ---------------------------------------------------
       SAVE TO LOCAL STORAGE WHENEVER IT CHANGES
  --------------------------------------------------- */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  /* ---------------------------------------------------
       ADD A NEW NOTIFICATION
  --------------------------------------------------- */
  const addNotification = (type: NotificationType, message: string) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),          // safer unique ID
      type,
      message,
      timestamp: new Date().toISOString(), // 🔥 FIXED: string ISO format
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);
  };

  /* ---------------------------------------------------
       MARK ONE AS READ
  --------------------------------------------------- */
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  /* ---------------------------------------------------
       MARK ALL AS READ
  --------------------------------------------------- */
  const markAllAsRead = () => {
    // Clear all to avoid clutter in the admin panel
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside <NotificationProvider>");
  }
  return ctx;
}
