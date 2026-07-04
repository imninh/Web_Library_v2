import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, setToken } from "./api";
import type { User } from "./types";

type Ctx = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (u: string, p: string) => Promise<void>;
  register: (body: { username: string; password: string; full_name?: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const r = await authApi.me();
      setUser(r.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const login = useCallback(async (u: string, p: string) => {
    const r = await authApi.login(u, p);
    await setToken(r.token);
    await refresh();
  }, [refresh]);

  const register = useCallback(async (body: { username: string; password: string; full_name?: string; email?: string }) => {
    const r = await authApi.register(body);
    await setToken(r.token);
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    await setToken(null);
    setUser(null);
  }, []);

  return <AuthCtx.Provider value={{ user, loading, refresh, login, register, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth(): Ctx {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}
