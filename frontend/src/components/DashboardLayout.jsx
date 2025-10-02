import React from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom'; // 1. NavLink را ایمپورت کن
import { useAuth } from '../contexts/AuthContext';
import { FaHome, FaChartBar, FaLightbulb, FaSignOutAlt } from 'react-icons/fa';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* منوی کناری */}
      <aside className="sidebar">
        <div>
          <h3>پلتفرم هوش تجاری</h3>
          <nav>
            <ul>
              {/* ۲. تمام تگ‌های <a> با NavLink جایگزین شدند و href به to تبدیل شد */}
              <li><NavLink to="/"><FaHome /> <span>خانه</span></NavLink></li>
              <li><NavLink to="/reports"><FaChartBar /> <span>گزارشات</span></NavLink></li>
              <li><NavLink to="/insights"><FaLightbulb /> <span>تحلیل‌ها</span></NavLink></li>
            </ul>
          </nav>
        </div>
        <div className="sidebar-footer">
          <a href="#" onClick={handleLogout} className="logout-link"><FaSignOutAlt /> <span>خروج</span></a>
        </div>
      </aside>

      {/* منوی پایینی موبایل */}
      <nav className="bottom-nav">
        <NavLink to="/" title="خانه"><FaHome /></NavLink>
        <NavLink to="/reports" title="گزارشات"><FaChartBar /></NavLink>
        <NavLink to="/insights" title="تحلیل‌ها"><FaLightbulb /></NavLink>
        <a href="#" onClick={handleLogout} title="خروج"><FaSignOutAlt /></a>
      </nav>
      
      <main className="main-content">
        <Outlet /> 
      </main>
    </div>
  );
};

export default DashboardLayout;