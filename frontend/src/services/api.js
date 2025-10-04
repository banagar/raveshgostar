// frontend/src/services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000', // آدرس بک‌اند شما
});

export const loginUser = async (username, password) => {
  // بک‌اند FastAPI برای فرم‌های OAuth2 انتظار داده به صورت x-www-form-urlencoded داره
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);

  try {
    const response = await apiClient.post('/api/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (response.data.access_token) {
      // توکن رو در localStorage ذخیره می‌کنیم تا در درخواست‌های بعدی استفاده بشه
      localStorage.setItem('userToken', response.data.access_token);
    }
    return response.data;
  } catch (error) {
    console.error("Login failed:", error.response?.data);
    throw error.response?.data || { detail: "An unknown error occurred" };
  }
};

// تابع جدید برای ارسال دستور متنی به بک‌اند
export const postCommand = async (commandText, token) => {
  try {
    const response = await apiClient.post(
      '/api/command',
      { command_text: commandText },
      {
        headers: {
          Authorization: `Bearer ${token}`, // ارسال توکن برای احراز هویت
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Command processing failed:", error.response?.data);
    throw error.response?.data || { detail: "خطا در پردازش دستور" };
  }
};

export const getKpiSummary = async () => {
  // توکن به صورت خودکار توسط AuthContext در هدرها قرار گرفته
  try {
    const response = await apiClient.get('/api/reports/kpi/summary');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch KPI summary:", error.response?.data);
    throw error.response?.data || { detail: "خطا در دریافت آمار" };
  }
};

export const getSalesTrends = async (period = 'month') => {
  try {
    // پارامتر period را به عنوان query string به URL اضافه می‌کنیم
    const response = await apiClient.get(`/api/reports/sales/trends?period=${period}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch sales trends:", error.response?.data);
    throw error.response?.data || { detail: "خطا در دریافت روند فروش" };
  }
};

export const getTopProducts = async (period = 'month') => {
  try {
    const response = await apiClient.get(`/api/reports/sales/top-products?period=${period}`);
    return response.data;
  } catch (error) {
    // ...
  }
};

export const getCategoryAnalysis = async (period = 'month') => { // ++ پارامتر period اضافه شد
  try {
    // ++ پارامتر به عنوان query string به URL اضافه شد
    const response = await apiClient.get(`/api/reports/sales/category-analysis?period=${period}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch category analysis:", error.response?.data);
    throw error.response?.data || { detail: "خطا در دریافت گزارش دسته‌بندی" };
  }
};

// تابع جدید برای دریافت جمله انگیزشی
export const getQuote = async () => {
  const response = await apiClient.get('/api/quote');
  return response.data;
};

// تابع جدید برای دریافت آخرین فعالیت‌ها
export const getRecentActivities = async () => {
  const response = await apiClient.get('/api/recent-activities');
  return response.data;
};

export default apiClient;