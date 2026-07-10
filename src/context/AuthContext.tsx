import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "../api/axios";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role?: string;
  instructor_status?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (fields: Partial<AuthUser>) => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const login = (newUser: AuthUser) => {
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (fields: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...fields };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: AuthUser }>("/users/me");
      const fresh = data.data;
      setUser(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          role: fresh.role,
          instructor_status: fresh.instructor_status,
          avatar_url: fresh.avatar_url ?? prev.avatar_url,
        };
        localStorage.setItem("user", JSON.stringify(updated));
        return updated;
      });
    } catch {
      // silent — stale cache is still usable
    }
  }, []);

  // Sync role/instructor_status on mount so cached user is never stale
  useEffect(() => {
    if (localStorage.getItem("user")) refreshUser();
  }, [refreshUser]);

  // Keep state in sync when another tab logs in/out
  useEffect(() => {
    const sync = () => {
      try {
        const u = localStorage.getItem("user");
        setUser(u ? (JSON.parse(u) as AuthUser) : null);
      } catch {
        localStorage.removeItem("user");
        setUser(null);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateUser, refreshUser, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
