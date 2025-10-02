import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.jsx'; // 1. ایمپورت

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* 2. کل برنامه را در بر می‌گیرد */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);