"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

type UserData = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
};

type UserContextType = {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<UserData>) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/user/profile", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setError(null);
      } else if (response.status === 401) {
        setUser(null);
        setError(null);
      } else {
        setError("Erro ao carregar perfil");
      }
    } catch (err) {
      console.error("Erro ao carregar usuário:", err);
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    await fetchUser();
  }, [fetchUser]);

  const updateUser = useCallback((data: Partial<UserData>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, error, refreshUser, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
