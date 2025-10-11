// src/components/FormModal.jsx

import React, { useEffect } from "react";
// ✅ InputNumber اینجا اضافه شد
import { Modal, Form, Input, Select, InputNumber } from "antd";

const { Option } = Select;

const FormModal = ({ visible, onCancel, onFinish, initialValues = {}, loading }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        form.setFieldsValue(initialValues);
    }, [initialValues, form]);

    const handleOk = () => {
        form.validateFields()
            .then((values) => {
                onFinish(values);
            })
            .catch((info) => {
                console.log("Validate Failed:", info);
            });
    };

    return (
        <Modal
            title={initialValues.id ? "ویرایش فرم" : "تعریف فرم جدید"}
            open={visible}
            onOk={handleOk}
            onCancel={onCancel}
            okText="ذخیره"
            cancelText="انصراف"
            confirmLoading={loading}
        >
            <Form form={form} layout="vertical" name="form_in_modal" initialValues={initialValues}>
                <Form.Item name="code" label="کد فرم" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="name" label="نام فرم" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="form_type" label="نوع فرم" rules={[{ required: true }]}> 
                    <Select placeholder="انتخاب کنید">
                        <Option value="SINGLE_SECTION">یک‌بخشی (فقط هدر)</Option>
                        <Option value="DOUBLE_SECTION">دوبخشی (هدر و اقلام)</Option>
                    </Select>
                </Form.Item>
                <Form.Item name="display_order" label="ترتیب نمایش" rules={[{ required: true }]}>
                    {/* ✅ حالا برنامه این کامپوننت را می‌شناسد */}
                    <InputNumber style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                    name="color"
                    label="رنگ کارت (مثلا #40a9ff)"
                    rules={[{ required: true }]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default FormModal;