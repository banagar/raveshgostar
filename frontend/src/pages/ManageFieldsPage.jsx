// src/pages/ManageFieldsPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Row,
    Col,
    Card,
    Form,
    Input,
    Select,
    Button,
    message,
    List,
    Typography,
    Tag,
    Checkbox,
    InputNumber,
    Popconfirm,
    Spin,
    Space,
} from "antd";
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import axiosInstance from "../api/axiosInstance";

const { Text } = Typography;
const { Option } = Select;

const ManageFieldsPage = () => {
    const { formId } = useParams();
    const navigate = useNavigate();
    const [mainForm, setMainForm] = useState(null);
    const [fields, setFields] = useState([]);
    const [allForms, setAllForms] = useState([]);
    const [editingField, setEditingField] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [fieldForm] = Form.useForm();
    const fieldType = Form.useWatch("field_type", fieldForm);
    const isComputed = Form.useWatch("is_computed", fieldForm);
    const lookupFormId = Form.useWatch("lookup_form", fieldForm);
    const lookupRefFieldId = Form.useWatch("lookup_reference_field", fieldForm);

    const selectedLookupForm = allForms.find((f) => f.id === lookupFormId);

    const fetchFields = async () => {
        try {
            const response = await axiosInstance.get(`/forms/${formId}/`);
            setMainForm(response.data);
            setFields(response.data.fields);
        } catch (error) {
            message.error("خطا در دریافت اطلاعات فیلدها");
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            await fetchFields();
            try {
                // ✅✅✅ آدرس اینجا اصلاح شد ✅✅✅
                const allFormsResponse = await axiosInstance.get("/forms/");
                setAllForms(allFormsResponse.data);
            } catch (error) {
                message.error("خطا در دریافت لیست فرم‌ها");
            }
            setLoading(false);
        };
        fetchInitialData();
    }, [formId]);

    const handleFormSubmit = async (values) => {
        setSubmitting(true);
        const url = editingField
            ? `/forms/${formId}/fields/${editingField.id}/`
            : `/forms/${formId}/fields/`;
        const method = editingField ? "put" : "post";

        try {
            await axiosInstance[method](url, values);
            message.success(`فیلد با موفقیت ${editingField ? "ویرایش" : "ذخیره"} شد`);
            await fetchFields();
            handleCancelEdit();
        } catch (error) {
            message.error("خطا در ذخیره فیلد. کد فیلد نباید تکراری باشد");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (fieldId) => {
        try {
            await axiosInstance.delete(`/forms/${formId}/fields/${fieldId}/`);
            message.success("فیلد با موفقیت حذف شد");
            await fetchFields();
        } catch (error) {
            message.error("خطا در حذف فیلد");
        }
    };

    const handleEditClick = (field) => {
        setEditingField(field);
        fieldForm.setFieldsValue(field);
    };

    const handleCancelEdit = () => {
        setEditingField(null);
        fieldForm.resetFields();
    };

    if (loading) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;

    return (
        <div>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <Card
                        title={
                            editingField ? `ویرایش فیلد: ${editingField.name}` : "افزودن فیلد جدید"
                        }
                    >
                        <Form
                            form={fieldForm}
                            layout="vertical"
                            onFinish={handleFormSubmit}
                            initialValues={{ section: "HEADER", field_type: "NUMBER", computation_order: 1 }}
                        >
                            {mainForm?.form_type === "DOUBLE_SECTION" && (
                                <Form.Item
                                    name="section"
                                    label="بخش فیلد"
                                    rules={[{ required: true }]}
                                >
                                    <Select>
                                        <Option value="HEADER">هدر</Option>
                                        <Option value="ITEM">اقلام (ردیف‌ها)</Option>
                                    </Select>
                                </Form.Item>
                            )}
                            <Form.Item
                                name="code"
                                label="کد فیلد (انگلیسی)"
                                rules={[{ required: true }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item name="name" label="نام فیلد" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="field_type"
                                label="نوع فیلد"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    <Option value="TEXT">متنی</Option>
                                    <Option value="NUMBER">عددی</Option>
                                    <Option value="DATE">تاریخی</Option>
                                    <Option value="LOOKUP">لوکاپ</Option>
                                    <Option value="LOOKUP_DISPLAY">لوکاپ نمایشی</Option>
                                </Select>
                            </Form.Item>

                            {fieldType === "NUMBER" && (
                                <Card
                                    type="inner"
                                    title="ویژگی‌های فیلد عددی"
                                    style={{ marginBottom: 24 }}
                                >
                                    <Space direction="vertical">
                                        <Form.Item
                                            name="has_auto_increment"
                                            valuePropName="checked"
                                            noStyle
                                        >
                                            <Checkbox>افزایش خودکار</Checkbox>
                                        </Form.Item>
                                        <Form.Item
                                            name="is_computed"
                                            valuePropName="checked"
                                            noStyle
                                        >
                                            <Checkbox>محاسباتی</Checkbox>
                                        </Form.Item>
                                    </Space>
                                </Card>
                            )}

                            {isComputed && (
                                <Card
                                    type="inner"
                                    title="تنظیمات محاسباتی"
                                    style={{ marginBottom: 24 }}
                                >
                                    <Form.Item
                                        name="computation_level"
                                        label="سطح محاسبه"
                                        rules={[{ required: true }]}
                                    >
                                        <Select placeholder="انتخاب کنید">
                                            {mainForm?.form_type === "DOUBLE_SECTION" && (
                                                <Option value="ITEM">سطح آیتم</Option>
                                            )}
                                            {mainForm?.form_type === "DOUBLE_SECTION" && (
                                                <Option value="AGGREGATE">سطح تجمعی (هدر)</Option>
                                            )}
                                            <Option value="HEADER">سطح هدر</Option>
                                        </Select>
                                    </Form.Item>
                                    <Form.Item name="computation_order" label="ترتیب محاسبه">
                                        <InputNumber />
                                    </Form.Item>
                                    <Form.Item name="computation_formula" label="فرمول محاسبه">
                                        <Input.TextArea placeholder="مثال: field_code1 + field_code2" />
                                    </Form.Item>
                                </Card>
                            )}

                            {fieldType === "LOOKUP" && (
                                <Card
                                    type="inner"
                                    title="تنظیمات لوکاپ"
                                    style={{ marginBottom: 24 }}
                                >
                                    <Form.Item
                                        name="lookup_form"
                                        label="فرم مرجع"
                                        rules={[{ required: true }]}
                                    >
                                        <Select
                                            placeholder="انتخاب فرم"
                                            onChange={() => {
                                                fieldForm.setFieldsValue({
                                                    lookup_reference_field: null,
                                                    lookup_display_field: null,
                                                });
                                            }}
                                        >
                                            {allForms
                                                .filter((f) => f.id !== mainForm?.id)
                                                .map((f) => (
                                                    <Option key={f.id} value={f.id}>
                                                        {f.name}
                                                    </Option>
                                                ))}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item
                                        name="lookup_reference_field"
                                        label="فیلد مرجع"
                                        rules={[{ required: true }]}
                                    >
                                        <Select
                                            placeholder="انتخاب فیلد مرجع"
                                            disabled={!lookupFormId}
                                        >
                                            {selectedLookupForm?.fields.map((f) => (
                                                <Option key={f.id} value={f.id}>
                                                    {f.name} ({f.code})
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item
                                        name="lookup_display_field"
                                        label="فیلد نمایشی"
                                        rules={[{ required: true }]}
                                    >
                                        <Select
                                            placeholder="انتخاب فیلد نمایشی"
                                            disabled={!lookupFormId}
                                        >
                                            {selectedLookupForm?.fields
                                                .filter((f) => f.id !== lookupRefFieldId)
                                                .map((f) => (
                                                    <Option key={f.id} value={f.id}>
                                                        {f.name} ({f.code})
                                                    </Option>
                                                ))}
                                        </Select>
                                    </Form.Item>
                                </Card>
                            )}

                            {fieldType === "LOOKUP_DISPLAY" && (
                                <Card
                                    type="inner"
                                    title="تنظیمات لوکاپ نمایشی"
                                    style={{ marginBottom: 24 }}
                                >
                                    <Form.Item
                                        name="lookup_reference_field"
                                        label="وابسته به کدام فیلد لوکاپ؟"
                                        rules={[{ required: true }]}
                                    >
                                        <Select placeholder="انتخاب فیلد">
                                            {fields
                                                .filter((f) => f.field_type === "LOOKUP")
                                                .map((f) => (
                                                    <Option key={f.id} value={f.id}>
                                                        {f.name} ({f.code})
                                                    </Option>
                                                ))}
                                        </Select>
                                    </Form.Item>
                                </Card>
                            )}

                            <Card type="inner" title="ویژگی‌های عمومی">
                                <Space direction="vertical">
                                    <Form.Item name="is_required" valuePropName="checked" noStyle>
                                        <Checkbox>اجباری</Checkbox>
                                    </Form.Item>
                                    <Form.Item name="is_unique" valuePropName="checked" noStyle>
                                        <Checkbox>یکتا (غیرتکراری)</Checkbox>
                                    </Form.Item>
                                    <Form.Item
                                        name="is_readonly_on_edit"
                                        valuePropName="checked"
                                        noStyle
                                    >
                                        <Checkbox>فقط-خواندنی در ویرایش</Checkbox>
                                    </Form.Item>
                                </Space>
                            </Card>

                            <Form.Item style={{ marginTop: 24 }}>
                                <Button type="primary" htmlType="submit" block loading={submitting}>
                                    {editingField ? "ذخیره تغییرات" : "افزودن فیلد"}
                                </Button>
                                {editingField && (
                                    <Button
                                        style={{ marginTop: 8 }}
                                        block
                                        onClick={handleCancelEdit}
                                    >
                                        انصراف
                                    </Button>
                                )}
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
                <Col xs={24} lg={16}>
                    <Card title="لیست فیلدهای تعریف شده">
                        <List
                            itemLayout="horizontal"
                            dataSource={fields}
                            renderItem={(item) => (
                                <List.Item
                                    actions={[
                                        <Button
                                            type="link"
                                            icon={<EditOutlined />}
                                            onClick={() => handleEditClick(item)}
                                        />,
                                        <Popconfirm
                                            title="آیا از حذف این فیلد مطمئن هستید؟"
                                            description={
                                                <Space direction="vertical">
                                                    {item.delete_reasons.map((r) => (
                                                        <Text type="danger" key={r}>
                                                            - {r}
                                                        </Text>
                                                    ))}
                                                </Space>
                                            }
                                            onConfirm={() => handleDelete(item.id)}
                                            disabled={!item.can_delete}
                                            okText="بله"
                                            cancelText="خیر"
                                        >
                                            <Button
                                                type="text"
                                                icon={<DeleteOutlined />}
                                                danger
                                                disabled={!item.can_delete}
                                            />
                                        </Popconfirm>,
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={
                                            <Text>
                                                {item.name} ({item.code})
                                            </Text>
                                        }
                                        description={<Tag color="blue">{item.field_type}</Tag>}
                                    />
                                    <Space>
                                        {item.section === "ITEM" && <Tag>آیتم</Tag>}
                                        {item.is_required && <Tag color="red">اجباری</Tag>}
                                        {item.is_unique && <Tag color="gold">یکتا</Tag>}
                                        {item.is_computed && <Tag color="purple">محاسباتی</Tag>}
                                    </Space>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ManageFieldsPage;