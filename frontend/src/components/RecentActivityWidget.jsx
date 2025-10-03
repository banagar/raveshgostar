// src/components/RecentActivityWidget.jsx

import React from 'react';
import { FaClock, FaUser, FaFileInvoiceDollar } from 'react-icons/fa';
import './RecentActivityWidget.css';

// تابعی برای نمایش زمان به صورت "چند دقیقه/ساعت پیش"
const timeSince = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " سال پیش";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " ماه پیش";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " روز پیش";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " ساعت پیش";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " دقیقه پیش";
  return "همین الان";
};

const RecentActivityWidget = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="activity-widget">
        <h3>آخرین فعالیت‌ها</h3>
        <p>فعالیت جدیدی ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div className="activity-widget">
      <h3>آخرین فعالیت‌ها</h3>
      <ul className="activity-list">
        {activities.map((activity, index) => (
          <li key={index} className="activity-item">
            <div className="activity-icon"><FaFileInvoiceDollar /></div>
            <div className="activity-details">
              <span className="customer-name">
                فروش به <strong>{activity.customer_name}</strong>
              </span>
              <span className="invoice-total">
                {activity.total_invoice_price.toLocaleString('fa-IR')} تومان
              </span>
            </div>
            <div className="activity-time">
              <FaClock /> {timeSince(activity.invoice_timestamp)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivityWidget;