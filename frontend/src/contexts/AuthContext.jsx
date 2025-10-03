import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('userToken') || null);
  const [isLoading, setIsLoading] = useState(true);

  // تابع logout را اینجا تعریف می‌کنیم تا در دسترس باشد
  const logout = () => {
    localStorage.removeItem('userToken');
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
  };
  
  useEffect(() => {
    setIsLoading(true);
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser({ username: decodedUser.sub, displayName: decodedUser.display_name });
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error("Invalid token:", error);
        // اگر توکن از ابتدا نامعتبر بود، کاربر را خارج کن
        logout();
      }
    }
    setIsLoading(false);
  }, [token]);

  // useEffect جدید برای رهگیری خطاها
  useEffect(() => {
    const errorInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        // اگر خطای 401 (عدم احراز هویت) رخ داد، کاربر را خارج کن
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    // در زمان پاکسازی، رهگیر را حذف می‌کنیم
    return () => {
      apiClient.interceptors.response.eject(errorInterceptor);
    };
  }, []); // این useEffect فقط یک بار اجرا می‌شود

  const login = (newToken) => {
    localStorage.setItem('userToken', newToken);
    setToken(newToken);
  };

  const value = { user, token, isLoading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};