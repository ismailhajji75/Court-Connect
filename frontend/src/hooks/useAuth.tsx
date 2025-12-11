import { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  role: "ADMIN" | "SUPERADMIN" | "STUDENT";
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "courtconnect-auth";
const API_BASE =
  (import.meta as any).env?.VITE_API_URL || "/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const decodeToken = (token: string) => {
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded as { id?: number; email?: string; username?: string; role?: string };
    } catch {
      return null;
    }
  };

  // hydrate + verify session on first load
  useEffect(() => {
    const verifySession = async () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsLoading(false);
        return;
      }

      try {
        const parsed = JSON.parse(stored) as User;
        if (!parsed?.token) {
          localStorage.removeItem(STORAGE_KEY);
          setIsLoading(false);
          return;
        }

        const decoded = decodeToken(parsed.token);
        if (!decoded || !decoded.email) {
          localStorage.removeItem(STORAGE_KEY);
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Validate token with backend /me
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${parsed.token}` },
        });

        if (!res.ok) {
          localStorage.removeItem(STORAGE_KEY);
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const me = await res.json();
        const storedEmail = (parsed.email || "").toLowerCase();
        const serverEmail = (me.email || "").toLowerCase();
        const decodedEmail = (decoded.email || "").toLowerCase();

        if (
          (storedEmail && serverEmail && storedEmail !== serverEmail) ||
          (storedEmail && decodedEmail && storedEmail !== decodedEmail)
        ) {
          // token belongs to a different account; force logout
          localStorage.removeItem(STORAGE_KEY);
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        const hydrated: User = {
          ...parsed,
          id: me.id ?? parsed.id ?? decoded.id ?? 0,
          username: me.username ?? parsed.username ?? decoded.username ?? "",
          email: (me.email ?? parsed.email ?? decoded.email ?? "").toLowerCase(),
          role: (me.role ?? parsed.role ?? decoded.role ?? "STUDENT") as User["role"],
        };

        setUser(hydrated);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    // clear any existing session before attempting login
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setIsAuthenticated(false);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        // Clear any stale session on failed login
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }

      const data = await res.json();
      const nextUser: User = {
        ...data.user,
        token: data.token,
        email: data.user.email?.toLowerCase(),
      };

      // extra verification against /me
      const verifyRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${nextUser.token}` },
      });
      if (!verifyRes.ok) {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }
      const me = await verifyRes.json();
      nextUser.id = me.id ?? nextUser.id;
      nextUser.username = me.username ?? nextUser.username;
      nextUser.email = (me.email ?? nextUser.email)?.toLowerCase();
      nextUser.role = me.role ?? nextUser.role;

      setUser(nextUser);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      return nextUser;
    } catch (err) {
      console.error("Login failed:", err);
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
