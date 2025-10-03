// src/components/InvoiceCard.jsx
import React from 'react';
import './InvoiceCard.css'; 

const InvoiceCard = ({ invoiceData }) => {
  // تابعی برای فرمت کردن اعداد
  const formatNumber = (num) => {
    // اگر ورودی عدد نبود، همان را برگردان
    if (typeof num !== 'number') {
        return num;
    }
    return num.toLocaleString('fa-IR');
  };

  // تابعی برای نمایش تاریخ
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fa-IR', options);
  };

  // چون داده‌ها از دو منبع متفاوت میان، باید هوشمندانه عمل کنیم
  const invoiceItems = invoiceData.items || (() => {
    // اگر تعداد در دیتا وجود نداشت، ۱ در نظر بگیر
    const quantity = invoiceData.quantity || 1;
    // قیمت کل فاکتور رو بگیر
    const totalPrice = invoiceData.total_invoice_price || invoiceData.total_price;

    // قیمت هر آیتم رو محاسبه کن: یا از دیتای ورودی بخون یا از تقسیم قیمت کل بر تعداد بدست بیار
    const pricePerItem = invoiceData.price_per_item || (totalPrice && quantity ? totalPrice / quantity : 0);

    return [{
        item_id: 1,
        product: { product_name: invoiceData.product_name },
        quantity: quantity,
        price_per_item: pricePerItem,
        total_item_price: totalPrice
    }];
  })();


  return (
    <div className="invoice-card">
      {/* بخش هدر فاکتور */}
      <div className="invoice-header">
        <div className="header-item">
          <span>شماره فاکتور</span>
          <strong>{invoiceData.invoice_id}</strong>
        </div>
        <div className="header-item">
          <span>مشتری</span>
          <strong>{invoiceData.customer?.customer_name || invoiceData.customer_name}</strong>
        </div>
        <div className="header-item">
          <span>تاریخ</span>
          <strong>{formatDate(invoiceData.invoice_timestamp || new Date())}</strong>
        </div>
        <div className="header-item total-price">
          <span>مبلغ کل</span>
          <strong>{formatNumber(invoiceData.total_invoice_price || invoiceData.total_price)} تومان</strong>
        </div>
      </div>

      {/* جدول اقلام فاکتور */}
      <table className="invoice-items-table">
        <thead>
          <tr>
            <th>ردیف</th>
            <th>محصول</th>
            <th>تعداد</th>
            <th>قیمت واحد</th>
            <th>قیمت کل</th>
          </tr>
        </thead>
        <tbody>
          {invoiceItems.map((item, index) => (
            <tr key={item.item_id || index}>
              <td>{index + 1}</td>
              <td>{item.product?.product_name || item.product_name}</td>
              <td>{formatNumber(item.quantity)}</td>
              <td>{formatNumber(item.price_per_item)}</td>
              <td>{formatNumber(item.total_item_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceCard;