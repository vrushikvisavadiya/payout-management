"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Role = "OPS" | "FINANCE";

interface AuthUser {
  email: string;
  role: Role;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const r = await fetch("/api/auth/me");
      if (!r.ok) {
        setUser(null);
        return;
      }
      const data = await r.json();
      setUser(data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchMe().finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    await fetchMe();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
