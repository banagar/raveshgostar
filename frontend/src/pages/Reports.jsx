import React, { useState, useEffect } from 'react';
import { getSalesTrends, getTopProducts } from '../services/api';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import TopProductsChart from '../components/charts/TopProductsChart';
import './Reports.css';

const Reports = () => {
  const [reportsData, setReportsData] = useState({ trends: [], topProducts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        // به جای Promise.all از دریافت جداگانه استفاده می‌کنیم تا حس بهتری بده
        const trendsData = await getSalesTrends();
        const topProductsData = await getTopProducts();
        setReportsData({ trends: trendsData, topProducts: topProductsData });
      } catch (err) {
        setError('خطا در بارگذاری گزارشات.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportsData();
  }, []);
  
  // اگر خطا وجود داشت، خطا را نمایش بده
  if (error) return <div className="error-message">{error}</div>;

  // همیشه ساختار گرید را نمایش بده
  return (
    <div className="reports-container">
      <h1 className="mobile-only-title">گزارشات فروش</h1>

      <div className="reports-grid">
        <div className="chart-container">
          {/* اگر در حال لودینگ بود، پیام لودینگ، وگرنه خود نمودار */}
          {loading ? <div className="loading-placeholder">در حال بارگذاری نمودار...</div> : <SalesTrendChart />}
        </div>
        <div className="chart-container">
          {loading ? <div className="loading-placeholder">در حال بارگذاری نمودار...</div> : <TopProductsChart />}
        </div>
      </div>
    </div>
  );
};

export default Reports;