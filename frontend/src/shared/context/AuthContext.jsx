import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("access_token") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem("access_token", token);
      apiClient
        .get("/api/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => {
          setToken("");
          setUser(null);
          localStorage.removeItem("access_token");
        })
        .finally(() => setLoading(false));
    } else {
      localStorage.removeItem("access_token");
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    const res = await apiClient.post("/api/auth/login", formData);
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const signup = async (payload) => {
    const res = await apiClient.post("/api/auth/signup", payload);
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("access_token");
  };

  const updateProfile = async (payload) => {
    const res = await apiClient.put("/api/auth/profile", payload);
    setUser(res.data);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
