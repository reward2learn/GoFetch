import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { storage } from "@/src/utils/storage";
import { api, TOKEN_KEY } from "@/src/api/client";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  bio?: string;
  walletAddress: string;
  kycStatus: "unverified" | "verified";
  reputation: number;
  reviewsCount: number;
  ordersCompleted: number;
  tripsCompleted: number;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (name: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
};

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await storage.secureGet<string>(TOKEN_KEY, "");
      if (!token) {
        setUserState(null);
        return;
      }
      const me = await api.get("/auth/me");
      setUserState(me);
    } catch {
      setUserState(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const login = useCallback(async (name: string, email: string) => {
    const data = await api.post("/auth/login", { name, email });
    await storage.secureSet(TOKEN_KEY, data.token);
    setUserState(data.user);
  }, []);

  const logout = useCallback(async () => {
    await storage.secureRemove(TOKEN_KEY);
    setUserState(null);
  }, []);

  const setUser = useCallback((u: User) => setUserState(u), []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
