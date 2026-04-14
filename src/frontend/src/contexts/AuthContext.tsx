import { createContext, useContext, useEffect, useState } from "react";

interface AuthUser {
  email: string;
  username: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("cyberscan_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("cyberscan_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("cyberscan_user");
    }
  }, [user]);

  function login(email: string, username: string) {
    setUser({ email, username });
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
