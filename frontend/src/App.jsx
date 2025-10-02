// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout'; // ایمپورت با اسم جدید
import Login from './pages/Login';
import Home from './pages/Home';
import Reports from './pages/Reports';
import Insights from './pages/Insights';
import DataReview from './pages/DataReview'; // ایمپورت صفحه جدید

import { useAuth } from './contexts/AuthContext';

const PrivateRoutes = () => {
  const { token, isLoading } = useAuth(); // ۱. isLoading را از کانتکست بگیر

  // ۲. اگر در حال بررسی اولیه هستیم، یک پیام لودینگ نشون بده
  if (isLoading) {
    return <div>در حال بارگذاری...</div>; // یا یک کامپوننت اسپینر زیبا
  }

  // ۳. بعد از اتمام بارگذاری، مثل قبل توکن رو چک کن
  return token ? <DashboardLayout /> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* روت لاگین کاملا مستقل و بدون Layout است */}
        <Route path="/login" element={<Login />} />

        {/* روت‌های خصوصی که همگی داخل Layout داشبورد نمایش داده می‌شوند */}
        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<Home />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/review" element={<DataReview />} />
        </Route>

        {/* اگر کاربر به روتی رفت که وجود نداره، به صفحه اصلی هدایت بشه */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;