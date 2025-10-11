// src/pages/ManageFormsPage.jsx

import React, { useState, useEffect } from "react";
import { Button, List, Card, Typography, message, Popconfirm, Spin } from "antd";
import { PlusOutlined, EditOutlined, SettingOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import FormModal from "../components/FormModal";
import dayjs from "dayjs"; // برای کار با تاریخ
import "dayjs/locale/fa"; // برای فارسی کردن خروجی

const { Text } = Typography;

const ManageFormsPage = () => {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingForm, setEditingForm] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    const fetchForms = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get("/forms/");

            // --- اینجا اصلاح شد ---
            // ما مستقیماً با response.data کار می‌کنیم چون خروجی API یک آرایه است
            const sortedForms = response.data.sort((a, b) => a.display_order - b.display_order);
            setForms(sortedForms);
            // --- پایان اصلاح ---
        } catch (error) {
            message.error("خطا در دریافت لیست فرم‌ها");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForms();
    }, []);

    const showCreateModal = () => {
        setEditingForm(null);
        setIsModalVisible(true);
    };

    const showEditModal = (form) => {
        setEditingForm(form);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleFormFinish = async (values) => {
        setSubmitting(true);
        const apiCall = editingForm
            ? axiosInstance.put(`/forms/${editingForm.id}/`, values)
            : axiosInstance.post("/forms/", values);

        try {
            await apiCall;
            message.success(`فرم با موفقیت ${editingForm ? "ویرایش" : "ساخته"} شد`);
            setIsModalVisible(false);
            setEditingForm(null);
            fetchForms();
        } catch (error) {
            const errorMsg = error.response?.data?.code?.[0] || "خطا در ذخیره فرم";
            message.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (formId) => {
        try {
            await axiosInstance.delete(`/forms/${formId}/`);
            message.success("فرم با موفقیت حذف شد");
            fetchForms();
        } catch (error) {
            message.error("خطا در حذف فرم. ممکن است این فرم دارای فیلد یا رکورد باشد");
        }
    };

    if (loading) {
        return <Spin size="large" style={{ display: "block", marginTop: "50px" }} />;
    }

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                }}
            >
                <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
                    فرم جدید
                </Button>
            </div>

            <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                dataSource={forms}
                renderItem={(form) => (
                    <List.Item>
                        <Card
                            style={{
                                borderTop: `5px solid ${form.color}`,
                                background: `linear-gradient(to bottom, ${form.color}11, #ffffff)`,
                            }}
                            title={form.name}
                            actions={[
                                <SettingOutlined
                                    key="setting"
                                    onClick={() => navigate(`/manage/forms/${form.id}/fields`)}
                                />,
                                <EditOutlined key="edit" onClick={() => showEditModal(form)} />,
                                <Popconfirm
                                    title="آیا از حذف این فرم مطمئن هستید؟"
                                    onConfirm={() => handleDelete(form.id)}
                                    okText="بله"
                                    cancelText="خیر"
                                >
                                    <DeleteOutlined key="delete" />
                                </Popconfirm>,
                            ]}
                        >
                            <p>
                                تعداد فیلدها: <Text strong>{form.fields.length}</Text>
                            </p>
                            <p>
                                تاریخ ایجاد:{" "}
                                <Text type="secondary">{dayjs(form.created_at).fromNow()}</Text>
                            </p>
                        </Card>
                    </List.Item>
                )}
            />

            <FormModal
                visible={isModalVisible}
                onCancel={handleCancel}
                onFinish={handleFormFinish}
                initialValues={editingForm || { form_type: "SINGLE_SECTION", display_order: 10, color: "#40a9ff" }}
                loading={submitting}
            />
        </div>
    );
};

export default ManageFormsPage;