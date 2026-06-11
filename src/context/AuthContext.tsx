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
  token: string | null;
  login: (user: AuthUser, token: string) => void;
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
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token")
  );

  const login = (newUser: AuthUser, newToken: string) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
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
    if (!localStorage.getItem("token")) return;
    try {
      const { data } = await api.get<{ data: AuthUser }>("/users/me");
      const fresh = data.data;
      setUser(prev => {
        if (!prev) return prev;
        const updated = { ...prev, role: fresh.role, instructor_status: fresh.instructor_status };
        localStorage.setItem("user", JSON.stringify(updated));
        return updated;
      });
    } catch {
      // silent — stale cache is still usable
    }
  }, []);

  // Sync role/instructor_status on mount so cached user is never stale
  useEffect(() => {
    if (token) refreshUser();
  }, [token, refreshUser]);

  // Keep state in sync when another tab logs in/out
  useEffect(() => {
    const sync = () => {
      const t = localStorage.getItem("token");
      const u = localStorage.getItem("user");
      setToken(t);
      setUser(u ? (JSON.parse(u) as AuthUser) : null);
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, updateUser, refreshUser, isAuthenticated: !!token }}
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
