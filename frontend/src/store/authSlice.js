// src/store/authSlice.js

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null, // ✅ اضافه شد
  isAuthenticated: !!localStorage.getItem('accessToken'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens: (state, action) => { // ✅ نام تابع تغییر کرد
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh; // ✅ اضافه شد
      state.isAuthenticated = true;
      localStorage.setItem('accessToken', action.payload.access);
      localStorage.setItem('refreshToken', action.payload.refresh); // ✅ اضافه شد
    },
    logout: (state) => {
      state.accessToken = null;
      state.refreshToken = null; // ✅ اضافه شد
      state.isAuthenticated = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken'); // ✅ اضافه شد
    },
    // ✅ تابع جدید برای آپدیت فقط توکن دسترسی
    setAccessToken: (state, action) => {
        state.accessToken = action.payload;
        localStorage.setItem('accessToken', action.payload);
    }
  },
});

export const { setTokens, logout, setAccessToken } = authSlice.actions;
export default authSlice.reducer;