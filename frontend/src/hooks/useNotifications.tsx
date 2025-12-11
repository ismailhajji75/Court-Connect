import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth";

export interface Notification {
  id: number | string;
  subject: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const POLL_MS = 30_000;

export function useNotifications(): UseNotificationsResult {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const API_BASE =
    (import.meta as any).env?.VITE_API_URL || "/api";

  const refresh = async () => {
    if (!isAuthenticated || !user?.token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) return;
      const data = await res.json();

      setNotifications((prev) => {
        const prevMap = new Map<string | number, Notification>();
        prev.forEach((n) => prevMap.set(n.id, n));

        const merged = (data as any[]).map((n) => {
          const existing = prevMap.get(n.id);
          return {
            id: n.id,
            subject: n.subject,
            message: n.message,
            createdAt: n.createdAt,
            read: existing?.read ?? false,
          } as Notification;
        });
        return merged.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.token]);

  const markAllRead = async () => {
    if (!isAuthenticated || !user?.token) return;

    // Optimistically clear locally for instant UX
    setNotifications([]);

    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      // If backend rejected, restore by refetching so UI stays consistent
      if (!res.ok) {
        await refresh();
      }
    } catch (err) {
      console.error("Failed to clear notifications", err);
      // Try to re-sync with server if something went wrong
      await refresh();
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return { notifications, unreadCount, markAllRead, refresh };
}
