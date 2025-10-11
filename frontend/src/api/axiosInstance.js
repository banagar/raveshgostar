// src/api/axiosInstance.js

import axios from 'axios';
import { store } from '../store/store';
import { logout, setAccessToken } from '../store/authSlice';
import { message } from 'antd';

const axiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Interceptor پاسخ با منطق کامل و اصلاح‌شده
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // فقط در صورتی که خطا از نوع 401 (عدم احراز هویت) و به دلیل انقضای توکن باشد
    if (error.response?.status === 401 && error.response.data.code === 'token_not_valid' && !originalRequest._retry) {
      originalRequest._retry = true; // جلوگیری از تلاش مجدد بی‌نهایت

      const refreshToken = store.getState().auth.refreshToken;

      // ✅ سناریو ۱: اگر RefreshToken وجود داشت، برای تمدید تلاش کن
      if (refreshToken) {
        try {
          const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
            refresh: refreshToken,
          });
          
          const newAccessToken = response.data.access;
          store.dispatch(setAccessToken(newAccessToken));
          
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);

        } catch (refreshError) {
          // ✅ اگر تمدید با RefreshToken هم شکست خورد، کاربر را خارج کن
          store.dispatch(logout());
          message.error('نشست شما منقضی شده است. لطفاً دوباره وارد شوید.');
          // هدایت به صفحه ورود
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // ✅ سناریو ۲: اگر RefreshToken اصلاً وجود نداشت، کاربر را خارج کن
        store.dispatch(logout());
        message.error('برای ادامه نیاز به ورود مجدد است.');
        // هدایت به صفحه ورود
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    // برای خطاهای دیگر، آن‌ها را به روال عادی برگردان
    return Promise.reject(error);
  }
);

export default axiosInstance;