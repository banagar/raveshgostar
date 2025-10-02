import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useWindowSize } from '../../hooks/useWindowSize';
import { getTopProducts } from '../../services/api';
import ChartControls from '../ChartControls';

ChartJS.defaults.font.family = 'Vazirmatn';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TopProductsChart = () => {
  const [period, setPeriod] = useState('month');
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowSize();

  const PERIOD_OPTIONS = [
    { label: 'سالانه', value: 'year' },
    { label: 'ماهانه', value: 'month' },
    { label: 'هفتگی', value: 'week' },
    { label: 'روزانه', value: 'day' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getTopProducts(period);
        setApiData(data);
      } catch (error) { console.error("Error fetching top products", error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [period]);

  const chartData = {
    labels: apiData.map(item => item.product_name),
    datasets: [{
        label: 'درآمد کل',
        data: apiData.map(item => item.total_revenue),
        backgroundColor: '#4299E1',
    }],
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      title: { display: false },
       tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.x; // در نمودار میله‌ای افقی، مقدار روی محور x است
            return `${label}: ${value.toLocaleString('fa-IR')}`;
          }
        }
      }
    },
    scales: { 
      y: { 
        ticks: { 
          color: '#A0AEC0',
          // این تابع لیبل‌های محور عمودی (اسامی محصولات) را برمی‌گرداند
          callback: function(value, index, ticks) {
            return this.getLabelForValue(value);
          }
        } 
      }, 
      x: { 
        ticks: { 
          color: '#A0AEC0',
          // **تغییر اصلی اینجاست**: این تابع اعداد محور افقی را فارسی می‌کند
          callback: function (value) {
            return value.toLocaleString('fa-IR');
          }
        } 
      } 
    },
  };

  return (
    <>
      <div className="chart-header-controls" style={{ justifyContent: 'center' }}>
        <ChartControls options={PERIOD_OPTIONS} selectedOption={period} onOptionChange={setPeriod} />
      </div>
      <div className="chart-canvas-wrapper">
        {loading ? (
          <div className="loading-placeholder">در حال بارگذاری...</div>
        ) : (
          <Bar key={`${width}-${period}`} options={options} data={chartData} />
        )}
      </div>
    </>
  );
};

export default TopProductsChart;