"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  credits: number;
  quota: number;
  subscriptionPlan: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
  refreshUsage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("intellix_token");
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("intellix_token", token);
    document.cookie = `intellix_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  } else {
    localStorage.removeItem("intellix_token");
    document.cookie = "intellix_token=; path=/; max-age=0";
  }
}

function mapUser(raw: any): User {
  return {
    id: raw?.id ?? "",
    name: raw?.name ?? null,
    email: raw?.email ?? "",
    role: raw?.role ?? "USER",
    image: raw?.avatarUrl ?? null,
    credits: 0,
    quota: 0,
    subscriptionPlan: "FREE",
  };
}

function errorMessage(data: any): string {
  if (!data) return "Request failed";
  if (typeof data.message === "string") return data.message;
  if (Array.isArray(data.message) && data.message.length) return data.message.join(", ");
  return "Request failed";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const applyUsage = useCallback((u: User | null, usage: any) => {
    if (!u) return;
    setUser((prev) =>
      prev && prev.id === u.id
        ? { ...prev, credits: usage?.remaining ?? prev.credits, quota: usage?.quota ?? prev.quota }
        : u
    );
  }, []);

  const fetchUsage = useCallback(
    async (u: User) => {
      try {
        const res = await fetch(`${API_URL}/usage/me`, {
          headers: { Authorization: `Bearer ${getStoredToken()}` },
        });
        const data = await res.json();
        if (res.ok) applyUsage(u, data);
      } catch {
        // usage unavailable - keep zero credits
      }
    },
    [applyUsage]
  );

  const fetchUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const u = mapUser(data.user);
        setUser(u);
        await fetchUsage(u);
      } else {
        setStoredToken(null);
      }
    } catch {
      setStoredToken(null);
    } finally {
      setLoading(false);
    }
  }, [fetchUsage]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(errorMessage(data));
    const u = mapUser(data.user);
    setStoredToken(data.accessToken);
    setUser(u);
    await fetchUsage(u);
    toast.success("Welcome back!");
    router.push("/dashboard");
    router.refresh();
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(errorMessage(data));
    const u = mapUser(data.user);
    setStoredToken(data.accessToken);
    setUser(u);
    await fetchUsage(u);
    toast.success("Account created!");
    router.push("/dashboard");
    router.refresh();
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const refreshUsage = useCallback(async () => {
    if (user) await fetchUsage(user);
  }, [user, fetchUsage]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, getToken: getStoredToken, refreshUsage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
