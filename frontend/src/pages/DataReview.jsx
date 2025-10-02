import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReviewCard from '../components/ReviewCard';
import { FaCheckCircle, FaUser, FaBoxOpen, FaFileInvoiceDollar } from 'react-icons/fa';
import './DataReview.css';

const DataReview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reviewData = location.state?.reviewData;

  // اگر داده‌ای وجود نداشت (مثلا کاربر مستقیم به این آدرس آمده)، به صفحه اصلی برگردان
  if (!reviewData) {
    navigate('/');
    return null;
  }

  // آماده‌سازی داده‌ها برای نمایش در کارت‌ها
  const invoiceInfo = {
    'شماره فاکتور': reviewData.invoice_id,
    'مبلغ کل': `${reviewData.total_price.toLocaleString('fa-IR')} تومان`
  };
  const customerInfo = { 'نام مشتری': reviewData.customer_name };
  const productInfo = { 'نام محصول': reviewData.product_name };

  return (
    <div className="review-container">
      <div className="success-header">
        <FaCheckCircle className="success-icon" />
        <h1>{reviewData.message}</h1>
        <p>اطلاعات زیر در سیستم ثبت گردید.</p>
      </div>

      <div className="cards-grid">
        <ReviewCard title="اطلاعات فاکتور" data={invoiceInfo} icon={<FaFileInvoiceDollar />} />
        <ReviewCard title="اطلاعات مشتری" data={customerInfo} icon={<FaUser />} />
        <ReviewCard title="اطلاعات محصول" data={productInfo} icon={<FaBoxOpen />} />
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