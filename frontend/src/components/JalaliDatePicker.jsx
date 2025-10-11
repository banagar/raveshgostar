// src/components/JalaliDatePicker.jsx

import React from 'react';
import generatePicker from 'antd/es/date-picker/generatePicker';
import dayjsGenerateConfig from 'rc-picker/lib/generate/dayjs';
import fa_IR from 'antd/es/locale/fa_IR';

// 1. DatePicker پایه را مانند قبل می‌سازیم
const DatePicker = generatePicker(dayjsGenerateConfig);

// 2. نام ماه‌های صحیح شمسی را به ترتیب تعریف می‌کنیم
const jalaliMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

// 3. یک آبجکت زبان سفارشی و کامل می‌سازیم
// ما کل تنظیمات فارسی antd را کپی کرده و فقط بخش ماه‌ها را بازنویسی (override) می‌کنیم
const customLocale = {
  ...fa_IR.DatePicker, // تمام تنظیمات اصلی (مانند دکمه "امروز" و...) را کپی می‌کنیم
  lang: {
    ...fa_IR.DatePicker.lang, // تمام متون و فرمت‌های زبان را کپی می‌کنیم
    months: jalaliMonths,      // ✅ فقط نام کامل ماه‌ها را با لیست شمسی خودمان جایگزین می‌کنیم
    shortMonths: jalaliMonths, // ✅ نام کوتاه ماه‌ها را هم با همان لیست جایگزین می‌کنیم
  },
};

// 4. کامپوننت نهایی را با استفاده از آبجکت زبان سفارشی خودمان می‌سازیم
const JalaliDatePicker = (props) => {
  return (
    <DatePicker
      {...props} // تمام پراپ‌های ورودی را حفظ می‌کنیم
      locale={customLocale} // آبجکت کامل و اصلاح‌شده خودمان را به عنوان زبان به کامپوننت می‌دهیم
    />
  );
};

export default JalaliDatePicker;