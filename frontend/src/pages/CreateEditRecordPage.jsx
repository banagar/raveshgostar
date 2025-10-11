// src/pages/CreateEditRecordPage.jsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Form, Button, Card, Typography, message, Spin, Row, Col, Space, Divider } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import axiosInstance from "../api/axiosInstance";
import FormField from "../components/FormField";
import dayjs from "dayjs";
import useBreakpoint from "../hooks/useBreakpoint";

const { Text } = Typography;

const evaluateFormula = (formula, context) => {
    if (!formula) return null;

    // پیدا کردن تمام کدهای فیلد در فرمول (مثلا: price, tax, quantity)
    const variables = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    let safeExpression = formula;

    // جایگزین کردن کد فیلدها با مقادیر عددی آنها از context
    for (const variable of variables) {
        const value = parseFloat(context[variable] || 0);
        // استفاده از regex برای جلوگیری از جایگزینی اشتباه (مثلا price در total_price)
        safeExpression = safeExpression.replace(new RegExp(`\\b${variable}\\b`, "g"), value);
    }

    try {
        // اجرای عبارت ریاضی امن شده
        // این روش بسیار امن‌تر از eval() است
        return new Function("return " + safeExpression)();
    } catch (error) {
        console.error("خطا در محاسبه فرمول:", error);
        return null; // در صورت خطا، مقدار خالی برمی‌گردانیم
    }
};

const CreateEditRecordPage = () => {
    const { formId, recordId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [formMetadata, setFormMetadata] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    const isEditMode = !!recordId && location.pathname.endsWith("/edit");
    const isViewMode = !!recordId && location.pathname.endsWith("/view");
    const isDesktop = useBreakpoint("md");

    const { headerFields, itemFields } = useMemo(() => {
        if (!formMetadata) return { headerFields: [], itemFields: [] };
        return {
            headerFields: formMetadata.fields.filter((f) => f.section === "HEADER"),
            itemFields: formMetadata.fields.filter((f) => f.section === "ITEM"),
        };
    }, [formMetadata]);

    const fetchAndSetAutoIncrementValue = useCallback(
        async (fields) => {
            const autoIncrementField = fields.find((f) => f.has_auto_increment);
            if (autoIncrementField) {
                try {
                    const response = await axiosInstance.get(
                        `/forms/${formId}/fields/${autoIncrementField.id}/suggest-auto-increment/`
                    );
                    form.setFieldsValue({
                        [autoIncrementField.code]: response.data.next_value,
                    });
                } catch (error) {
                    console.error("خطا در دریافت مقدار پیشنهادی", error);
                }
            }
        },
        [formId, form]
    );

    useEffect(() => {
        const fetchMetadata = async () => {
            setLoading(true);
            try {
                const formResponse = await axiosInstance.get(`/forms/${formId}/`);
                const currentMetadata = formResponse.data;
                setFormMetadata(currentMetadata);

                if (isEditMode || isViewMode) {
                    const recordResponse = await axiosInstance.get(
                        `/forms/${formId}/records/${recordId}/`
                    );
                    const initialValues = {};

                    recordResponse.data.values.forEach((val) => {
                        const fieldMeta = currentMetadata.fields.find(
                            (f) => f.code === val.field_code
                        );
                        if (!fieldMeta) return;

                        if (fieldMeta.field_type === "DATE" && val.value) {
                            initialValues[val.field_code] = dayjs(val.value);
                        } else if (fieldMeta.field_type === "LOOKUP" && val.lookup_label) {
                            initialValues[val.field_code] = {
                                value: val.value,
                                label: val.lookup_label,
                            };
                        } else {
                            initialValues[val.field_code] = val.value;
                        }
                    });

                    // ✅ تکمیل منطق پر کردن اقلام در حالت ویرایش/مشاهده
                    const itemsData = (recordResponse.data.items || []).map((item) => {
                        const itemValues = {};
                        (item.values || []).forEach((val) => {
                            const fieldMeta = currentMetadata.fields.find(
                                (f) => f.code === val.field_code
                            );
                            if (!fieldMeta) return; // ✅ بهتره این بررسی وجود داشته باشه

                            if (fieldMeta.field_type === "DATE" && val.value) {
                                // برای هماهنگی با بک‌اند بهتره فرمت تاریخ رو YYYY-MM-DD بذاریم
                                itemValues[val.field_code] = dayjs(val.value);
                            } else if (fieldMeta.field_type === "LOOKUP" && val.lookup_label) {
                                // ✅ راه حل: منطق ساخت آبجکت برای فیلد لوکاپ اضافه شد
                                itemValues[val.field_code] = {
                                    value: val.value,
                                    label: val.lookup_label,
                                };
                            } else {
                                // برای بقیه فیلدها مثل متنی و عددی و لوکاپ نمایشی
                                itemValues[val.field_code] = val.value;
                            }
                        });
                        return itemValues;
                    });
                    initialValues.items = itemsData;

                    form.setFieldsValue(initialValues);
                } else {
                    await fetchAndSetAutoIncrementValue(
                        currentMetadata.fields.filter((f) => f.section === "HEADER")
                    );
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                message.error("خطا در دریافت اطلاعات");
            } finally {
                setLoading(false);
            }
        };
        fetchMetadata();
    }, [formId, recordId, isEditMode, isViewMode, form, fetchAndSetAutoIncrementValue]);

    const handleSubmit = async (values) => {
        setSubmitting(true);
        const payload = {
            header_values: {},
            items: values.items || [],
        };

        Object.keys(values).forEach((key) => {
            if (key !== "items") {
                payload.header_values[key] = values[key];
            }
        });

        const processValues = (obj) => {
            if (obj === null || obj === undefined) return obj;
            let finalValue = obj;
            if (typeof finalValue === "object" && finalValue.hasOwnProperty("value")) {
                finalValue = finalValue.value;
            } else if (finalValue && typeof finalValue.format === "function") {
                finalValue = finalValue.format("YYYY-MM-DD");
            }
            return finalValue;
        };

        for (const key in payload.header_values) {
            payload.header_values[key] = processValues(payload.header_values[key]);
        }

        payload.items = (payload.items || [])
            .map((item) => {
                if (!item) return null;
                const newItem = {};
                for (const key in item) {
                    newItem[key] = processValues(item[key]);
                }
                return newItem;
            })
            .filter(Boolean);

        const apiCall = isEditMode
            ? axiosInstance.put(`/forms/${formId}/records/${recordId}/`, payload)
            : axiosInstance.post(`/forms/${formId}/records/`, payload);

        try {
            await apiCall;
            message.success(`رکورد با موفقیت ${isEditMode ? "ویرایش" : "ثبت"} شد`);
            if (isEditMode) {
                navigate(`/forms/${formId}/records`);
            } else {
                form.resetFields();
                if (formMetadata) {
                    await fetchAndSetAutoIncrementValue(
                        formMetadata.fields.filter((f) => f.section === "HEADER")
                    );
                }
            }
        } catch (error) {
            const errorDetail = error.response?.data?.detail || "خطا در عملیات";
            message.error(errorDetail);
        } finally {
            setSubmitting(false);
        }
    };

    // ✅ اصلاح منطق افزودن ردیف برای کارایی بهتر
    const handleAddRow = (add) => {
        const items = form.getFieldValue("items") || [];
        const newRowInitialValues = {};

        itemFields.forEach((field) => {
            if (field.has_auto_increment) {
                const maxVal = items.reduce((max, current) => {
                    const currentVal = parseInt(current?.[field.code], 10) || 0;
                    return currentVal > max ? currentVal : max;
                }, 0);
                newRowInitialValues[field.code] = maxVal + 1;
            }
        });
        add(newRowInitialValues); // مقادیر اولیه مستقیماً به تابع add پاس داده می‌شود
    };

    const handleValuesChange = (changedValues, allValues) => {
        if (!formMetadata) return;

        // --- بخش ۱: ایجاد یک کپی امن از مقادیر بدون تخریب آبجکت‌های Moment ---
        const newValues = { ...allValues };
        // آیتم‌ها را هم به صورت امن کپی می‌کنیم تا رفرنس آبجکت‌های moment حفظ شود
        newValues.items = (allValues.items || []).map((item) => (item ? { ...item } : null));

        // --- بخش ۲: آپدیت لوکاپ نمایشی (در هدر و اقلام) ---
        const allFields = formMetadata.fields;
        const lookupFields = allFields.filter((f) => f.field_type === "LOOKUP");

        lookupFields.forEach((lookupField) => {
            const displayField = allFields.find(
                (f) =>
                    f.field_type === "LOOKUP_DISPLAY" && f.lookup_reference_field === lookupField.id
            );
            if (!displayField) return;

            // برای هدر
            if (lookupField.section === "HEADER") {
                const lookupValueObject = newValues[lookupField.code];
                if (
                    lookupValueObject &&
                    typeof lookupValueObject === "object" &&
                    "display_value" in lookupValueObject
                ) {
                    newValues[displayField.code] = lookupValueObject.display_value;
                }
            }
            // برای اقلام
            else if (lookupField.section === "ITEM") {
                (newValues.items || []).forEach((item, index) => {
                    if (!item) return;
                    const lookupValueObject = item[lookupField.code];
                    if (
                        lookupValueObject &&
                        typeof lookupValueObject === "object" &&
                        "display_value" in lookupValueObject
                    ) {
                        newValues.items[index][displayField.code] = lookupValueObject.display_value;
                    }
                });
            }
        });

        // --- بخش ۳: اجرای محاسبات فرمول‌ها ---
        const items = newValues.items || [];

        // الف) محاسبات سطح اقلام
        const itemComputedFields = itemFields.filter(
            (f) => f.is_computed && f.computation_level === "ITEM"
        );
        items.forEach((item, index) => {
            if (!item) return;
            itemComputedFields.forEach((field) => {
                const result = evaluateFormula(field.computation_formula, item);
                if (result !== null) {
                    items[index][field.code] = result;
                }
            });
        });

        // ب) محاسبات سطح تجمعی
        const aggregateComputedFields = headerFields.filter(
            (f) => f.is_computed && f.computation_level === "AGGREGATE"
        );
        aggregateComputedFields.forEach((field) => {
            const formula = field.computation_formula || "";
            const match = formula.match(/SUM\((.*?)\)/);
            if (match && match[1]) {
                const fieldToSum = match[1].trim();
                const sum = items.reduce((acc, currentItem) => {
                    return acc + (parseFloat(currentItem?.[fieldToSum]) || 0);
                }, 0);
                newValues[field.code] = sum;
            }
        });

        // ج) محاسبات سطح هدر
        const headerComputedFields = headerFields.filter(
            (f) => f.is_computed && f.computation_level === "HEADER"
        );
        // کانتکست محاسبات هدر باید شامل مقادیر جدید خودش هم باشد
        const headerContext = { ...newValues };
        headerComputedFields.forEach((field) => {
            const result = evaluateFormula(field.computation_formula, headerContext);
            if (result !== null) {
                newValues[field.code] = result;
            }
        });

        // --- بخش ۴: آپدیت نهایی و یکباره فرم ---
        form.setFieldsValue(newValues);
    };

    if (loading) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;

    // عرض ستون‌ها رو برای اضافه شدن ستون "ردیف" مجددا محاسبه می‌کنیم
    const itemColSpan = isDesktop ? Math.floor(21 / (itemFields.length || 1)) : 24;

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={handleValuesChange}
        >
            <Card style={{ marginBottom: 24 }}>
                {/* ✅ تغییر ۴: عنوان داینامیک */}
                <Row gutter={24}>
                    {headerFields.map((field) => (
                        // ✅ تغییر ۱: چیدمان هدر به 4 ستون در دسکتاپ
                        <Col xs={12} md={6} key={field.id}>
                            <FormField
                                field={field}
                                disabled={(isEditMode && field.is_readonly_on_edit) || isViewMode}
                            />
                        </Col>
                    ))}
                </Row>
            </Card>

            {formMetadata?.form_type === "DOUBLE_SECTION" && (
                <Card>
                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <>
                                {isDesktop && fields.length > 0 && (
                                    <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
                                        <Col span={1} style={{ textAlign: "center" }}>
                                            <Text strong>#</Text>
                                        </Col>

                                        {itemFields.map((itemField) => (
                                            <Col span={itemColSpan} key={`header-${itemField.id}`}>
                                                <Text strong>
                                                    {itemField.name}
                                                    {itemField.is_required && (
                                                        <span
                                                            style={{ color: "red", marginRight: 4 }}
                                                        >
                                                            {" "}
                                                            *
                                                        </span>
                                                    )}
                                                </Text>
                                            </Col>
                                        ))}
                                        <Col span={2} />
                                    </Row>
                                )}

                                {fields.map(({ key, name, ...restField }, index) => (
                                    <React.Fragment key={key}>
                                        {/* ✅ بخش جدید: هدر موبایلی برای هر ردیف */}
                                        {!isDesktop && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    marginBottom: "12px",
                                                    // برای ردیف‌های بعدی یک فاصله از بالا ایجاد می‌کند
                                                    marginTop: index > 0 ? "16px" : "0",
                                                }}
                                            >
                                                <Text strong type="secondary">
                                                    ردیف {index + 1}
                                                </Text>
                                                {!isViewMode && (
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => remove(name)}
                                                        // برای زیبایی بیشتر در موبایل
                                                        style={{ padding: "0 8px" }}
                                                    />
                                                )}
                                            </div>
                                        )}

                                        <Row gutter={[16, 16]} align="top">
                                            {isDesktop && (
                                                <Col
                                                    span={1}
                                                    style={{
                                                        textAlign: "center",
                                                        paddingTop: "8px",
                                                    }}
                                                >
                                                    <Text type="secondary">{index + 1}</Text>
                                                </Col>
                                            )}

                                            {itemFields.map((itemField) => (
                                                <Col
                                                    // ✅ تغییر اصلی: دو ستونه شدن در موبایل
                                                    xs={12}
                                                    md={itemColSpan}
                                                    key={`${key}-${itemField.id}`}
                                                >
                                                    <FormField
                                                        field={itemField}
                                                        disabled={
                                                            (isEditMode &&
                                                                itemField.is_readonly_on_edit) ||
                                                            isViewMode
                                                        }
                                                        formItemProps={{
                                                            ...restField,
                                                            name: [name, itemField.code],
                                                            label: isDesktop
                                                                ? null
                                                                : itemField.name,
                                                        }}
                                                    />
                                                </Col>
                                            ))}

                                            {/* ✅ دکمه حذف فقط در حالت دسکتاپ نمایش داده می‌شود */}
                                            {isDesktop && (
                                                <Col
                                                    xs={24}
                                                    md={2}
                                                    style={{
                                                        textAlign: "left",
                                                        paddingTop: "0px",
                                                    }}
                                                >
                                                    {!isViewMode && (
                                                        <Button
                                                            type="text"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => remove(name)}
                                                        />
                                                    )}
                                                </Col>
                                            )}
                                        </Row>
                                        {index < fields.length - 1 && (
                                            <Divider style={{ margin: "12px 0" }} />
                                        )}
                                    </React.Fragment>
                                ))}

                                {!isViewMode && (
                                    <Form.Item style={{ marginTop: 16 }}>
                                        <Button
                                            type="dashed"
                                            onClick={() => handleAddRow(add)}
                                            block
                                            icon={<PlusOutlined />}
                                        >
                                            افزودن ردیف جدید
                                        </Button>
                                    </Form.Item>
                                )}
                            </>
                        )}
                    </Form.List>
                </Card>
            )}

            <Form.Item style={{ marginTop: 24 }}>
                {!isViewMode && (
                    <Button type="primary" htmlType="submit" loading={submitting}>
                        ذخیره
                    </Button>
                )}
                <Button
                    style={{ marginRight: 8 }}
                    onClick={() => navigate(`/forms/${formId}/records`)}
                >
                    بازگشت
                </Button>
            </Form.Item>
        </Form>
    );
};

export default CreateEditRecordPage;
