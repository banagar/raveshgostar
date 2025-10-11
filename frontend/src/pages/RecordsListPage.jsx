// src/pages/RecordsListPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Table, Button, Typography, message, Spin, Input, Space, Popconfirm, Grid } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import axiosInstance from "../api/axiosInstance";
import debounce from "lodash.debounce";
import dayjs from "dayjs";

const { Search } = Input;
const { useBreakpoint } = Grid;

const RecordsListPage = () => {
    const { formId } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const screens = useBreakpoint();
    const isMobile = !screens.sm;

    const fetchData = useCallback(
        async (currentFormId, currentSearchTerm) => {
            setLoading(true);
            try {
                const formResponse = await axiosInstance.get(`/forms/${currentFormId}/`);
                setForm(formResponse.data);

                const recordsResponse = await axiosInstance.get(
                    `/forms/${currentFormId}/records/`,
                    {
                        params: { search: currentSearchTerm },
                    }
                );

                let recordsData = recordsResponse.data.results || recordsResponse.data || [];
                recordsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setRecords(recordsData);
            } catch (error) {
                message.error("خطا در دریافت اطلاعات یا فرم مورد نظر یافت نشد");
                navigate("/");
            } finally {
                setLoading(false);
            }
        },
        [navigate]
    );

    const debouncedFetchData = useCallback(debounce(fetchData, 300), [fetchData]);

    useEffect(() => {
        if (formId) {
            setSearchTerm("");
            fetchData(formId, "");
        }
    }, [formId, fetchData]);

    useEffect(() => {
        if (formId) {
            debouncedFetchData(formId, searchTerm);
        }
    }, [searchTerm, formId, debouncedFetchData]);

    // ✅✅✅ اصلاح اصلی و نهایی اینجا انجام شد ✅✅✅
    const handleDelete = async (recordId) => {
        try {
            await axiosInstance.delete(`/forms/${formId}/records/${recordId}/`);
            message.success("رکورد با موفقیت حذف شد");

            // راه حل جدید: فراخوانی مستقیم و فوری تابع اصلی واکشی داده‌ها
            // این روش مطمئن‌ترین راه برای همگام‌سازی با سرور است
            fetchData(formId, searchTerm);
        } catch (error) {
            const errorDetail = error.response?.data?.detail || "خطا در حذف رکورد";
            message.error(errorDetail);
        }
    };

    const actionColumn = {
        key: "action",
        width: isMobile ? 50 : 100,
        align: "left",
        render: (_, record) => (
            <Space size="small">
                {form?.form_type === "DOUBLE_SECTION" && (
                    <Link
                        to={`/forms/${formId}/records/${record.key}/view`}
                        state={{ formName: form.name }}
                    >
                        <Button icon={<EyeOutlined />}>{!isMobile ? "مشاهده" : ""}</Button>
                    </Link>
                )}
                <Link
                    to={`/forms/${formId}/records/${record.key}/edit`}
                    state={{ formName: form.name }}
                >
                    <Button icon={<EditOutlined />}>{!isMobile ? "ویرایش" : ""}</Button>
                </Link>
                <Popconfirm
                    title="آیا از حذف این رکورد مطمئن هستید؟"
                    onConfirm={() => handleDelete(record.key)}
                    okText="بله"
                    cancelText="خیر"
                    disabled={!record.can_delete}
                >
                    <Button icon={<DeleteOutlined />} danger disabled={!record.can_delete} />
                </Popconfirm>
            </Space>
        ),
    };

    const columns = form
        ? [
              ...(form.form_type === "DOUBLE_SECTION"
                  ? form.fields.filter((f) => f.section === "HEADER")
                  : form.fields
              ).map((field) => ({
                  title: field.name,
                  dataIndex: field.code,
                  key: field.code,
              })),
              actionColumn,
          ]
        : [actionColumn];

    const dataSource = records.map((record) => {
        const rowData = { ...record, key: record.id };
        if (record.values && form?.fields) {
            // ✅ اطمینان از وجود متادیتای فرم
            record.values.forEach((val) => {
                // ۱. پیدا کردن اطلاعات کامل فیلد (برای دانستن نوع آن)
                const fieldMeta = form.fields.find((f) => f.code === val.field_code);

                let displayValue = val.lookup_label || val.value;

                // ۲. بررسی نوع فیلد و فرمت کردن تاریخ
                if (fieldMeta && fieldMeta.field_type === "DATE" && val.value) {
                    displayValue = dayjs(val.value).format("YYYY/MM/DD");
                }
                // منطق قبلی برای اعداد و سایر فیلدها بدون تغییر باقی می‌ماند
                else if (typeof val.value === "number" && val.value % 1 === 0) {
                    const intValue = parseInt(val.value, 10);
                    if (val.lookup_label) {
                        const labelAsNumber = parseFloat(val.lookup_label);
                        if (!isNaN(labelAsNumber) && labelAsNumber === val.value) {
                            displayValue = intValue;
                        }
                    } else {
                        displayValue = intValue;
                    }
                }

                rowData[val.field_code] = displayValue;
            });
        }
        return rowData;
    });

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "16px",
                }}
            >
                <Button type="primary" icon={<PlusOutlined />}>
                    <Link to={`/forms/${formId}/records/new`} state={{ formName: form?.name }}>
                        ثبت جدید
                    </Link>
                </Button>
            </div>
            <div style={{ marginBottom: "16px", marginTop: "16px", width: "100%" }}>
                <Search
                    placeholder="جستجو..."
                    allowClear
                    onSearch={(value) => setSearchTerm(value)}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Table
                loading={loading}
                dataSource={dataSource}
                columns={columns}
                rowKey="key"
                scroll={{ x: "max-content" }}
                pagination={{ position: ["bottomCenter"] }}
            />
        </div>
    );
};

export default RecordsListPage;
