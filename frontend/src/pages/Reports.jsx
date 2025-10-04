import React from 'react';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import TopProductsChart from '../components/charts/TopProductsChart';
import CategoryChart from '../components/charts/CategoryChart';
import './Reports.css';

const Reports = () => {
  return (
    <div className="reports-container">
      <h1 className="mobile-only-title">گزارشات فروش</h1>

      <div className="reports-grid">
        <div className="chart-container">
          <SalesTrendChart />
        </div>
        <div className="chart-container">
          <TopProductsChart />
        </div>
        <div className="chart-container">
          <CategoryChart />
        </div>
      </div>
    </div>
  );
};

export default Reports;