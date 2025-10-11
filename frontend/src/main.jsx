import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store.js";
import { ConfigProvider } from "antd";
import App from "./App.jsx";
import faIR from "antd/locale/fa_IR";
import "antd/dist/reset.css";
import './assets/fonts/fonts.css'; 
import dayjs from "dayjs";
import jalaliday from 'jalaliday/dayjs';

dayjs.extend(jalaliday);
dayjs.calendar('jalali');

// یک متغیر برای نام فونت جهت خوانایی بهتر
const vazirmatnFont = "'Vazirmatn', sans-serif";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ConfigProvider 
          direction="rtl" 
          locale={faIR}
          theme={{
            token: {
              fontFamily: vazirmatnFont,
            },
            components: {
              // اعمال فونت به صورت اختصاصی برای تضمین عملکرد
              Layout: { fontFamily: vazirmatnFont },
              Button: { fontFamily: vazirmatnFont },
              Typography: { fontFamily: vazirmatnFont },
              Form: { fontFamily: vazirmatnFont },
              Input: { fontFamily: vazirmatnFont },
              InputNumber: { fontFamily: vazirmatnFont },
              Select: { fontFamily: vazirmatnFont },
              Checkbox: { fontFamily: vazirmatnFont },
              DatePicker: { fontFamily: vazirmatnFont },
              Card: { fontFamily: vazirmatnFont },
              List: { fontFamily: vazirmatnFont },
              Table: { fontFamily: vazirmatnFont },
              Tag: { fontFamily: vazirmatnFont },
              Spin: { fontFamily: vazirmatnFont },
              Popconfirm: { fontFamily: vazirmatnFont },
              Modal: { fontFamily: vazirmatnFont },
              Dropdown: { fontFamily: vazirmatnFont },
              Menu: { fontFamily: vazirmatnFont },
            }
          }}
        >
          <App />
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);