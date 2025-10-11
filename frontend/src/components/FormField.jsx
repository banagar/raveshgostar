// src/components/FormField.jsx

import React, { useCallback } from "react";
// ✅DatePicker معمولی حذف و JalaliDatePicker ایمپورت می‌شود
import { Form, Input, InputNumber, message } from "antd";
import JalaliDatePicker from "./JalaliDatePicker"; // ✅ ایمپورت جدید
import AsyncSelect from "react-select/async";
import debounce from "lodash.debounce";
import axiosInstance from "../api/axiosInstance";

const formatOptionLabel = ({ value, label, code_value }, { context }) => {
    if (context === "value") {
        return code_value || value;
    }
    return label;
};

const FormField = ({ field, disabled, formItemProps = {} }) => {
    const isComputed = field.is_computed;

    const loadLookupOptions = useCallback(
        // ... (بخش جستجوی لوکاپ بدون تغییر باقی می‌ماند)
        (inputValue, callback) => {
            if (!field || !field.form || !field.id) {
                callback([]);
                return;
            }
            axiosInstance
                .get(`/forms/${field.form}/fields/${field.id}/search-lookup/?q=${inputValue}`)
                .then((response) => {
                    callback(response.data);
                })
                .catch((error) => {
                    console.error("خطا در جستجوی لوکاپ:", error);
                    message.error("جستجوی مقادیر با خطا مواجه شد");
                    callback([]);
                });
        },
        [field]
    );

    const debouncedLoadOptions = useCallback(debounce(loadLookupOptions, 500), [field]);

    let fieldElement;

    switch (field.field_type) {
        case "NUMBER":
            fieldElement = (
                <InputNumber style={{ width: "100%" }} disabled={disabled || isComputed} />
            );
            break;
        case "TEXT":
            fieldElement = <Input disabled={disabled || isComputed} />;
            break;
        case "DATE":
            // ✅ اینجا از کامپوننت جلالی استفاده می‌کنیم
            fieldElement = (
                <JalaliDatePicker style={{ width: "100%" }} disabled={disabled || isComputed} />
            );
            break;
        case "LOOKUP":
            fieldElement = (
                <AsyncSelect
                    cacheOptions={false}
                    loadOptions={debouncedLoadOptions}
                    defaultOptions
                    getOptionValue={(option) => option.value}
                    getOptionLabel={(option) => option.label}
                    formatOptionLabel={formatOptionLabel}
                    placeholder="جستجو کنید..."
                    isDisabled={disabled || isComputed}
                    isClearable={true}
                />
            );
            break;
        case "LOOKUP_DISPLAY":
            fieldElement = <Input disabled={true} />;
            break;
        default:
            fieldElement = <Input disabled={disabled || isComputed} />;
            break;
    }

    return (
        <Form.Item
            label={field.name}
            name={field.code}
            rules={[{ required: field.is_required }]}
            {...formItemProps}
        >
            {fieldElement}
        </Form.Item>
    );
};

export default FormField;