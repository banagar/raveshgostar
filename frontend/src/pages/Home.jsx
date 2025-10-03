// frontend/src/pages/Home.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getKpiSummary, getQuote, getRecentActivities } from '../services/api'; 
import KPI_Card from '../components/KPI_Card';
import FloatingActionButton from '../components/FloatingActionButton';
import CommandModal from '../components/CommandModal';
import CommandBar from '../components/CommandBar';
import RecentActivityWidget from '../components/RecentActivityWidget';
// آیکون‌های جدید رو اضافه کن
import { FaMoneyBillWave, FaUsers, FaChartLine, FaQuoteLeft, FaClock } from 'react-icons/fa';
import './Home.css';

// تابع تاریخ رو بدون تغییر نگه می‌داریم
const getCurrentDate = () => {
  return new Date().toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const Home = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();
  
  const [kpiData, setKpiData] = useState(null);
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [errorKpi, setErrorKpi] = useState(null);

  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [errorQuote, setErrorQuote] = useState(null);

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [errorActivities, setErrorActivities] = useState(null);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        setLoadingKpi(true);
        const data = await getKpiSummary();
        setKpiData(data);
      } catch (err) {
        setErrorKpi("خطا در بارگذاری شاخص‌ها");
      } finally {
        setLoadingKpi(false);
      }
    };

    const fetchQuote = async () => {
      try {
        setLoadingQuote(true);
        const data = await getQuote();
        setQuote(data);
      } catch (err) {
        setErrorQuote("خطا در دریافت جمله انگیزشی");
      } finally {
        setLoadingQuote(false);
      }
    };

    const fetchActivities = async () => {
      try {
        setLoadingActivities(true);
        const data = await getRecentActivities();
        setActivities(data);
      } catch (err) {
        setErrorActivities("خطا در بارگذاری فعالیت‌های اخیر");
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchKpis();
    fetchQuote();
    fetchActivities();
  }, []);

  const openCommandModal = () => setModalOpen(true);
  const closeCommandModal = () => setModalOpen(false);

  const cards = [
    {
      title: 'فروش امروز',
      value: loadingKpi ? '...' : `${kpiData?.todays_sales.toLocaleString('fa-IR')} تومان`,
      icon: <FaMoneyBillWave />,
    },
    {
      title: 'میانگین فروش هفته',
      value: loadingKpi ? '...' : `${kpiData?.weekly_average_sales.toLocaleString('fa-IR')} تومان`,
      icon: <FaChartLine />,
    },
    {
      title: 'مشتریان جدید ماه',
      value: loadingKpi ? '...' : `${kpiData?.new_customers_this_month.toLocaleString('fa-IR')} نفر`,
      icon: <FaUsers />,
    },
  ];

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-text">
          <h2>سلام {user?.displayName} عزیز</h2>
          {/* بخش تاریخ رو اینطوری تغییر بده */}
          <p className="current-date">
          <FaClock />  امروز، {getCurrentDate()}
          </p>
        </div>
        <div className="command-bar-wrapper">
          <CommandBar onOpen={openCommandModal} />
        </div>
      </header>
      
      {loadingQuote && <p>در حال بارگذاری جمله انگیزشی...</p>}
      {errorQuote && <p className="error-message">{errorQuote}</p>}
      {quote && (
        <blockquote className="quote-block">
          <FaQuoteLeft />
          <p className="quote-text">{quote.quote}</p>
          <cite className="quote-author">- {quote.author}</cite>
        </blockquote>
      )}

      {errorKpi && <p className="error-message">{errorKpi}</p>}

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
      
      <div className="activity-widget-container">
        {loadingActivities && <p>در حال بارگذاری فعالیت‌ها...</p>}
        {errorActivities && <p className="error-message">{errorActivities}</p>}
        {!loadingActivities && !errorActivities && (
          <RecentActivityWidget activities={activities} />
        )}
      </div>
      
      <FloatingActionButton onClick={openCommandModal} />
      <CommandModal isOpen={isModalOpen} onClose={closeCommandModal} />
    </div>
  );
};

export default Home;