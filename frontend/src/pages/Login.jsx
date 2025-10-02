// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { loginUser } from '../services/api';
import './Login.css'; // فایل استایل

import { useAuth } from '../contexts/AuthContext'; // از هوک خودمان استفاده کن
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth(); // تابع login را از کانتکست بگیر
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await loginUser(username, password);
      login(data.access_token); // توکن را به کانتکست بده تا ذخیره کند
      navigate('/'); // به صفحه اصلی هدایت کن
    } catch (err) {
      setError(err.detail || "نام کاربری یا رمز عبور اشتباه است.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <h2>ورود به سیستم</h2>
        <p>برای مدیریت فروش، وارد حساب کاربری خود شوید.</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">نام کاربری</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">رمز عبور</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button">ورود</button>
        </form>
        <div className="login-links">
          <a href="#">رمز عبور را فراموش کرده‌اید؟</a>
          <span>|</span>
          <a href="#">ثبت‌نام</a>
        </div>
      </div>
    </div>
  );
};

export default Login;