import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Availability } from "../admin/types/types";
import { useAuth } from "./useAuth";

interface AvailabilityContextType {
  availabilities: Availability[];
  addAvailability: (
    data: Omit<Availability, "id">
  ) => Promise<Availability | null>;
  deleteAvailability: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const AvailabilityContext = createContext<AvailabilityContextType | null>(null);

export function AvailabilityProvider({ children }: { children: ReactNode }) {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const { user, isAuthenticated } = useAuth();

  const API_BASE =
    (import.meta as any).env?.VITE_API_URL || "/api";

  const authHeaders = (): Record<string, string> =>
    user?.token
      ? {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        }
      : { "Content-Type": "application/json" };

  const refresh = async () => {
    try {
      const res = await fetch(`${API_BASE}/availability`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setAvailabilities(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load availability", err);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.token]);

  const addAvailability = async (
    data: Omit<Availability, "id">
  ): Promise<Availability | null> => {
    if (!user?.token) return null;
    try {
      const res = await fetch(`${API_BASE}/availability`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      const created = await res.json();
      setAvailabilities((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.error("Failed to add availability", err);
      return null;
    }
  };

  const deleteAvailability = async (id: string): Promise<boolean> => {
    if (!user?.token) return false;
    try {
      const res = await fetch(`${API_BASE}/availability/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) return false;
      setAvailabilities((prev) => prev.filter((a) => String(a.id) !== String(id)));
      return true;
    } catch (err) {
      console.error("Failed to delete availability", err);
      return false;
    }
  };

  return (
    <AvailabilityContext.Provider
      value={{ availabilities, addAvailability, deleteAvailability, refresh }}
    >
      {children}
    </AvailabilityContext.Provider>
  );
}

export function useAvailability() {
  const ctx = useContext(AvailabilityContext);
  if (!ctx) throw new Error("useAvailability must be used inside AvailabilityProvider");
  return ctx;
}
