// src/pages/LoginPage.jsx

import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance"; // مسیر ممکن است نیاز به تنظیم داشته باشد
import { setTokens } from "../store/authSlice"; // ✅ ایمپورت اصلاح شد

const { Title } = Typography;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogin = async (values) => {
        setLoading(true);
        try {
            // ارسال درخواست به بک‌اند برای دریافت توکن
            const response = await axiosInstance.post("/token/", {
                username: values.username,
                password: values.password,
            });

            // در صورت موفقیت، توکن را در Redux ذخیره می‌کنیم
            dispatch(setTokens(response.data)); // ✅ این خط جایگزین شود (کل آبجکت پاسخ را می‌فرستیم)
            message.success("ورود با موفقیت انجام شد");

            // کاربر را به صفحه اصلی هدایت می‌کنیم
            navigate("/");
        } catch (error) {
            // نمایش پیام خطا
            message.error("نام کاربری یا رمز عبور اشتباه است");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                background: "#f0f2f5",
            }}
        >
            <Card style={{ width: 400 }}>
                <Title level={2} style={{ textAlign: "center", marginBottom: "24px" }}>
                    ورود به سیستم
                </Title>
                <Form name="login" onFinish={handleLogin}>
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: "لطفاً نام کاربری خود را وارد کنید!" }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="نام کاربری" size="large" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: "لطفاً رمز عبور خود را وارد کنید!" }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="رمز عبور"
                            size="large"
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            style={{ width: "100%" }}
                            size="large"
                        >
                            ورود
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;