// src/pages/DataReview.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import InvoiceCard from '../components/InvoiceCard';
import { FaCheckCircle } from 'react-icons/fa';
import './DataReview.css';

const DataReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reviewData = location.state?.reviewData;

  // اگر داده‌ای وجود نداشت، به صفحه اصلی برگردان
  if (!reviewData) {
    navigate('/');
    return null;
  }

  return (
    <div className="review-container">
      <div className="success-header">
        <FaCheckCircle className="success-icon" />
        <h1>{reviewData.message}</h1>
      </div>

      <div className="invoice-display-area">
        <InvoiceCard invoiceData={reviewData} />
      </div>

      <div className="review-actions">
        <button className="confirm-button" onClick={() => navigate('/')}>
          تایید و بازگشت به داشبورد
        </button>
      </div>
    </div>
  );
};

export default DataReview;