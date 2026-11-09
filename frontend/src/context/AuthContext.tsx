import React, { createContext, useContext, useEffect, useState } from "react";
import { api, endpoints } from "../lib/api";

export type UserRole = "Donor" | "NGO" | "Volunteer" | "Admin";

export interface User {
  id?: number | string;
  full_name: string;
  email: string;
  role: UserRole;
  status?: string;
  phone?: string | null;
  organization?: string | null;
  address?: string | null;
  is_available?: boolean;
  verification_status?: "pending" | "approved" | "rejected";
  license_number?: string | null;
  license_document_url?: string | null;
  verified_at?: string | null;
  rejection_reason?: string | null;
}

export function normalizeUserRole(raw?: string): UserRole {
  const val = String(raw || "").trim().toLowerCase();
  if (val === "admin" || val === "administrator") return "Admin";
  if (val === "ngo" || val === "recipient" || val === "receiver") return "NGO";
  if (val === "volunteer" || val === "driver" || val === "courier") return "Volunteer";
  return "Donor";
}

function mapUserPayload(raw: Record<string, unknown> | undefined, fallbackName = "ANNAPURNA User", fallbackEmail = ""): User {
  const role = normalizeUserRole(String(raw?.role || "Donor"));
  return {
    id: (raw?.id as number | string | undefined),
    full_name: String(raw?.full_name || raw?.name || fallbackName),
    email: String(raw?.email || fallbackEmail),
    role,
    status: String(raw?.status || "active"),
    phone: (raw?.phone as string | null) ?? null,
    organization: (raw?.organization as string | null) ?? null,
    address: (raw?.address as string | null) ?? null,
    is_available: raw?.is_available !== undefined ? Boolean(raw.is_available) : true,
    verification_status: (raw?.verification_status as "pending" | "approved" | "rejected") || (role === "NGO" ? "pending" : "approved"),
    license_number: (raw?.license_number as string | null) ?? null,
    license_document_url: (raw?.license_document_url as string | null) ?? null,
    verified_at: (raw?.verified_at as string | null) ?? null,
    rejection_reason: (raw?.rejection_reason as string | null) ?? null,
  };
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (payload: {
    full_name: string;
    email: string;
    password: string;
    role: Exclude<UserRole, "Admin">;
    phone?: string;
    organization?: string;
    address?: string;
    license_number?: string;
    license_document_url?: string;
  }) => Promise<User>;
  bootstrapAdmin: (payload: {
    full_name: string;
    email: string;
    password: string;
  }) => Promise<User>;
  refreshUser: () => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem("shareplate_token");
    if (!saved || saved === "demo-token") return null;
    return saved;
  });

  const [user, setUser] = useState<User | null>(() => {
    const savedToken = localStorage.getItem("shareplate_token");
    if (!savedToken || savedToken === "demo-token") {
      localStorage.removeItem("shareplate_token");
      localStorage.removeItem("shareplate_user");
      return null;
    }
    const saved = localStorage.getItem("shareplate_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return mapUserPayload(parsed);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(Boolean(token));

  const refreshUser = async (): Promise<User | null> => {
    const currentToken = localStorage.getItem("shareplate_token");
    if (!currentToken) return null;
    try {
      const res = await api.get(endpoints.auth.me);
      const verifiedUser = mapUserPayload(res.data);
      localStorage.setItem("shareplate_user", JSON.stringify(verifiedUser));
      setUser(verifiedUser);
      return verifiedUser;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get(endpoints.auth.me)
      .then((res) => {
        const verifiedUser = mapUserPayload(res.data);
        localStorage.setItem("shareplate_user", JSON.stringify(verifiedUser));
        setUser(verifiedUser);
      })
      .catch(() => {
        localStorage.removeItem("shareplate_token");
        localStorage.removeItem("shareplate_user");
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const login = async (username: string, password: string): Promise<User> => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const res = await api.post(endpoints.auth.login, formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const accessToken = res.data?.access_token;
    if (!accessToken) {
      throw new Error("Authentication token missing from response.");
    }
    localStorage.setItem("shareplate_token", accessToken);
    setToken(accessToken);

    try {
      const meRes = await api.get(endpoints.auth.me);
      const userData = mapUserPayload(meRes.data, username, username);
      localStorage.setItem("shareplate_user", JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch {
      const fallbackUser = mapUserPayload(res.data?.user, username, username);
      localStorage.setItem("shareplate_user", JSON.stringify(fallbackUser));
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  const register = async (payload: {
    full_name: string;
    email: string;
    password: string;
    role: Exclude<UserRole, "Admin">;
    phone?: string;
    organization?: string;
    address?: string;
    license_number?: string;
    license_document_url?: string;
  }): Promise<User> => {
    await api.post(endpoints.auth.register, payload);
    return await login(payload.email, payload.password);
  };

  const bootstrapAdmin = async (payload: {
    full_name: string;
    email: string;
    password: string;
  }): Promise<User> => {
    const res = await api.post(endpoints.auth.bootstrapAdmin, payload);
    const accessToken = res.data?.access_token;
    if (accessToken) {
      localStorage.setItem("shareplate_token", accessToken);
      setToken(accessToken);
    }
    const adminUser = mapUserPayload(
      { ...res.data, role: "Admin", status: "active" },
      payload.full_name,
      payload.email
    );
    localStorage.setItem("shareplate_user", JSON.stringify(adminUser));
    setUser(adminUser);
    return adminUser;
  };

  const logout = () => {
    localStorage.removeItem("shareplate_token");
    localStorage.removeItem("shareplate_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, bootstrapAdmin, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
