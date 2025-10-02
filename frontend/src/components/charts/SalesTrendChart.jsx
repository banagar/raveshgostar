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
                borderColor: isRevenue ? '#38A169' : '#3182CE',
                backgroundColor: isRevenue ? 'rgba(56, 161, 105, 0.2)' : 'rgba(49, 130, 206, 0.2)',
                fill: true,
                tension: 0.3,
            }],
        });
    }, [apiData, metric, loading]);
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#EDF2F7' } },
      title: { display: false },
      tooltip: {
        callbacks: {
          title: function (tooltipItems) {
            return `تاریخ: ${tooltipItems[0].label}`;
          },
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            // اعداد داخل تولتیپ هم فارسی میشن
            return `${label}: ${value.toLocaleString('fa-IR')}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#A0AEC0',
          // این تابع اعداد محور عمودی را فارسی می‌کند
          callback: function (value) {
            return value.toLocaleString('fa-IR');
          }
        }
      },
      x: {
        ticks: {
          color: '#A0AEC0',
          // **تغییر اصلی اینجاست**: این تابع اعداد محور افقی را فارسی می‌کند
          // (برای مواقعی که لیبل‌ها عدد باشند)
          callback: function(value, index, ticks) {
            // this.getLabelForValue(value) لیبل اصلی را برمی‌گرداند
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