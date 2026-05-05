import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    setToken(storedToken);

    try {
      const { data } = await api.get("/auth/session");
      setUser(data.user);
    } catch (error) {
      console.log("SESSION ERROR:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshSession();
  }, []);

  const login = async (email, password, role_type) => {
    const res = await api.post("/auth/login", {
      email,
      password,
      role_type,
    });

    const token = res.data.token;

    localStorage.setItem("token", token);
    setToken(token);
    setUser(res.data.user);

    return res.data.user;
  };

  const logout = async () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = { user, token, loading, login, logout, refreshSession };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) throw new Error("useAuth must be used within AuthProvider");

  return ctx;
}
