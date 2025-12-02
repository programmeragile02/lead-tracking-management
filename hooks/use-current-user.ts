"use client";

import { useEffect, useState } from "react";

export type RoleSlug = "manager" | "team-leader" | "sales";

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  roleSlug: RoleSlug;
  roleCode: string | null;
  roleName: string | null;
}

interface UseCurrentUserState {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCurrentUser(): UseCurrentUserState {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchUser() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        setError("Unauthorized");
        return;
      }

      const data = await res.json();

      if (!data.ok || !data.authenticated || !data.user) {
        setUser(null);
        setError("Unauthorized");
        return;
      }

      setUser(data.user as CurrentUser);
    } catch (err) {
      console.error("useCurrentUser error:", err);
      setError("Terjadi kesalahan");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  return {
    user,
    loading,
    error,
    refresh: fetchUser,
  };
}
