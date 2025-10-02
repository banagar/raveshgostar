import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('userToken') || null);
  const [isLoading, setIsLoading] = useState(true); // ۱. وضعیت جدید برای بارگذاری اولیه

  useEffect(() => {
    setIsLoading(true); // هر بار که توکن عوض می‌شه، بارگذاری شروع می‌شه
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser({ username: decodedUser.sub, displayName: decodedUser.display_name });
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('userToken');
        setToken(null);
        setUser(null);
      }
    }
    setIsLoading(false); // ۲. بعد از اتمام کار، بارگذاری تمام می‌شود
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('userToken', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('userToken');
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  // ۳. isLoading را هم به بقیه برنامه می‌دهیم
  const value = { user, token, isLoading, login, logout };

  // ۴. تا وقتی در حال بررسی اولیه توکن هستیم، چیزی نمایش نمی‌دهیم
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};