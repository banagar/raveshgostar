import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { getSalesTrends } from '../../services/api';
import ChartControls from '../ChartControls';
import { useWindowSize } from '../../hooks/useWindowSize';

ChartJS.defaults.font.family = 'Vazirmatn';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const SalesTrendChart = () => {
  const [metric, setMetric] = useState('total_revenue');
  const [period, setPeriod] = useState('month');
  const [apiData, setApiData] = useState([]);
  const [chartConfig, setChartConfig] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);
  const { width } = useWindowSize();

  // ====================  تغییر از اینجا شروع میشه ====================

  // 1. خوندن متغیرهای رنگ از :root
  const rootStyles = getComputedStyle(document.documentElement);
  const accentColor = rootStyles.getPropertyValue('--accent-color').trim();
  const accentHoverColor = rootStyles.getPropertyValue('--accent-hover').trim();
  const textPrimaryColor = rootStyles.getPropertyValue('--text-primary').trim();
  const textSecondaryColor = rootStyles.getPropertyValue('--text-secondary').trim();

  // =================================================================

  const METRIC_OPTIONS = [
    { label: 'درآمد', value: 'total_revenue' },
    { label: 'تعداد', value: 'sales_count' },
  ];
  const PERIOD_OPTIONS = [
    { label: 'ماهانه', value: 'month' },
    { label: 'هفتگی', value: 'week' },
    { label: 'روزانه', value: 'day' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getSalesTrends(period);
        setApiData(data);
      } catch (error) {
        console.error("Error fetching trends data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  useEffect(() => {
    if (!apiData.length && !loading) {
      setChartConfig({ labels: [], datasets: [] });
      return;
    };
    const labels = apiData.map(item => item.invoice_timestamp);
    const isRevenue = metric === 'total_revenue';
    setChartConfig({
      labels: labels,
      datasets: [{
        label: isRevenue ? 'درآمد کل' : 'تعداد فروش',
        data: apiData.map(item => item[metric]),
        // 2. استفاده از متغیرهای خونده شده
        borderColor: isRevenue ? accentColor : accentHoverColor,
        // نکته: برای شفافیت، دو رقم هگز به انتهای کد رنگ اضافه میکنیم (مثلا '33' برای 20% شفافیت)
        backgroundColor: isRevenue ? `${accentColor}33` : `${accentHoverColor}33`,
        fill: true,
        tension: 0.3,
      }],
    });
  }, [apiData, metric, loading, accentColor, accentHoverColor]); // متغیرهای رنگ رو به وابستگی‌ها اضافه می‌کنیم

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          // 3. استفاده از متغیر برای رنگ متن
          color: textPrimaryColor
        }
      },
      title: { display: false },
      tooltip: {
        callbacks: {
          title: function(tooltipItems) {
            return `تاریخ: ${tooltipItems[0].label}`;
          },
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toLocaleString('fa-IR')}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // 4. استفاده از متغیر برای رنگ اعداد محور
          color: textSecondaryColor,
          callback: function(value) {
            return value.toLocaleString('fa-IR');
          }
        }
      },
      x: {
        grid: {
        display: false // این خط، خطوط شبکه‌ای افقی رو مخفی می‌کنه
        },
        ticks: {
          // 5. استفاده از متغیر برای رنگ اعداد محور
          color: textSecondaryColor,
          callback: function(value, index, ticks) {
            return this.getLabelForValue(value).toLocaleString('fa-IR');
          }
        }
      }
    },
  };

  return (
    <>
      <div className="chart-header-controls">
        <ChartControls options={PERIOD_OPTIONS} selectedOption={period} onOptionChange={setPeriod} />
        <ChartControls options={METRIC_OPTIONS} selectedOption={metric} onOptionChange={setMetric} />
      </div>
      {loading ? (
        <div className="loading-placeholder">در حال بارگذاری نمودار...</div>
      ) : (
        <div className="chart-canvas-wrapper">
          <Line key={`${width}-${period}-${metric}`} options={options} data={chartConfig} />
        </div>
      )}
    </>
  );
};
export default SalesTrendChart;