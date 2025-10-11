// src/pages/DashboardPage.jsx

import React, { useState, useEffect } from "react";
import { List, Card, Typography, message, Spin } from "antd";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import dayjs from "dayjs"; // برای کار با تاریخ
import relativeTime from "dayjs/plugin/relativeTime"; // برای نمایش "چند روز پیش"
import "dayjs/locale/fa"; // برای فارسی کردن خروجی

dayjs.extend(relativeTime);
dayjs.locale("fa");

const { Title, Text } = Typography;

const DashboardPage = () => {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await axiosInstance.get("/forms/");
                const sortedForms = response.data.sort((a, b) => a.display_order - b.display_order);
                setForms(sortedForms);
            } catch (error) {
                message.error("خطا در دریافت لیست فرم‌ها");
            } finally {
                setLoading(false);
            }
        };
        fetchForms();
    }, []);

    if (loading) {
        return <Spin size="large" style={{ display: "block", marginTop: "50px" }} />;
    }

    return (
        <div>
            <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                dataSource={forms}
                renderItem={(form) => (
                    <List.Item>
                        <Link to={`/forms/${form.id}/records`}>
                            <Card
                                hoverable
                                title={form.name}
                                style={{
                                    borderTop: `5px solid ${form.color}`,
                                    background: `linear-gradient(to bottom, ${form.color}11, #ffffff)`,
                                }}
                            >
                                <p>
                                    تعداد رکوردها: <Text strong>{form.record_count}</Text>
                                </p>
                                <p>
                                    آخرین ثبت:{" "}
                                    {form.last_record_date ? (
                                        <Text type="secondary">
                                            {dayjs(form.last_record_date).fromNow()}
                                        </Text>
                                    ) : (
                                        <Text type="secondary">هنوز رکوردی ثبت نشده</Text>
                                    )}
                                </p>
                            </Card>
                        </Link>
                    </List.Item>
                )}
            />
        </div>
    );
};

export default DashboardPage;