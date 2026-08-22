import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("access_token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiClient
        .get("/api/auth/me")
        .then((res) => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          logout();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const res = await apiClient.post("/api/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const accessToken = res.data.access_token;
    const userData = res.data.user;

    localStorage.setItem("access_token", accessToken);
    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  const signup = async (payload) => {
    const res = await apiClient.post("/api/auth/signup", payload);
    const accessToken = res.data.access_token;
    const userData = res.data.user;

    localStorage.setItem("access_token", accessToken);
    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  const updateProfile = async (payload) => {
    const res = await apiClient.put("/api/auth/profile", payload);
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
