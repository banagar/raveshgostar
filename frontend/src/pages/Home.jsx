import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getKpiSummary } from '../services/api'; // ۱. ایمپورت تابع API
import KPI_Card from '../components/KPI_Card';
import FloatingActionButton from '../components/FloatingActionButton';
import CommandModal from '../components/CommandModal';
import CommandBar from '../components/CommandBar';
import { FaMoneyBillWave, FaUsers, FaChartLine } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();
  
  // ۲. State برای نگهداری داده‌های KPI، وضعیت لودینگ و خطا
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ۳. useEffect برای دریافت داده‌ها وقتی کامپوننت لود می‌شود
  useEffect(() => {
    const fetchKpis = async () => {
      try {
        setLoading(true);
        const data = await getKpiSummary();
        setKpiData(data);
        setError(null);
      } catch (err) {
        setError("خطا در بارگذاری اطلاعات داشبورد");
        setKpiData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchKpis();
  }, []); // [] یعنی این افکت فقط یک بار بعد از اولین رندر اجرا شود

  const openCommandModal = () => setModalOpen(true);
  const closeCommandModal = () => setModalOpen(false);

  // ۴. آماده‌سازی کارت‌ها برای نمایش
  const cards = [
    {
      title: 'فروش امروز',
      value: loading ? '...' : `${kpiData?.todays_sales.toLocaleString('fa-IR')} تومان`,
      icon: <FaMoneyBillWave />,
    },
    {
      title: 'میانگین فروش هفته', // عنوان کارت به‌روز شد
      // مقدار کارت از داده‌های واقعی خوانده می‌شود
      value: loading ? '...' : `${kpiData?.weekly_average_sales.toLocaleString('fa-IR')} تومان`,
      icon: <FaChartLine />,
    },
    {
      title: 'مشتریان جدید ماه',
      value: loading ? '...' : `${kpiData?.new_customers_this_month.toLocaleString('fa-IR')} نفر`,
      icon: <FaUsers />,
    },
  ];

  return (
    <div className="home-container">
      <header className="home-header">
        <h2>سلام {user?.displayName}!</h2>
        <div className="command-bar-wrapper">
          <CommandBar onOpen={openCommandModal} />
        </div>
      </header>
      
      {error && <p className="error-message">{error}</p>}

      <div className="kpi-grid">
        {cards.map((card, index) => (
          <KPI_Card 
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
          />
        ))}
      </div>
      
      <FloatingActionButton onClick={openCommandModal} />
      <CommandModal isOpen={isModalOpen} onClose={closeCommandModal} />
    </div>
  );
};

export default Home;