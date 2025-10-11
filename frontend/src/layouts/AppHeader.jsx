// src/layouts/AppHeader.jsx

import React, { useState, useEffect } from "react";
import { Layout, Button, Space, Typography, Dropdown, Menu } from "antd";
import {
    LogoutOutlined,
    WindowsFilled,
    SettingOutlined,
    FileTextFilled,
    CaretDownFilled,
} from "@ant-design/icons";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import axiosInstance from "../api/axiosInstance";

const { Header } = Layout;

const AppHeader = () => {
    const [activeButton, setActiveButton] = useState("dashboard");
    const [formName, setFormName] = useState("فرم جاری");
    const [allForms, setAllForms] = useState([]);
    const location = useLocation();
    const params = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const formId = params.formId;

    useEffect(() => {
        axiosInstance
            .get("/forms/")
            .then((res) => {
                const sortedForms = res.data.sort((a, b) => a.display_order - b.display_order);
                setAllForms(sortedForms);
            })
            .catch(() => console.error("Could not fetch form list for header"));
    }, []);

    useEffect(() => {
        const path = location.pathname;
        if (path.includes("/forms/") && formId) {
            setActiveButton("currentForm");
            if (location.state?.formName) {
                setFormName(location.state.formName);
            } else {
                const currentForm = allForms.find((f) => f.id == formId);
                if (currentForm) {
                    setFormName(currentForm.name);
                }
            }
        } else if (path.includes("/manage/forms")) {
            setActiveButton("manageForms");
        } else {
            setActiveButton("dashboard");
        }
    }, [location, formId, allForms]);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    const NavButton = ({ to, buttonKey, icon, children, state }) => {
        const isActive = activeButton === buttonKey;
        return (
            <Link to={to} state={state}>
                <Button
                    type={isActive ? "primary" : "text"}
                    icon={icon}
                    style={{ color: isActive ? "" : "#fff" }}
                >
                    {isActive ? children : ""}
                </Button>
            </Link>
        );
    };

    // ✅ تغییر ۱: تبدیل منو به فرمت مورد نیاز پراپ `items`
    const menuItems = allForms.map((form) => ({
        key: form.id,
        label: (
            <Link to={`/forms/${form.id}/records`} state={{ formName: form.name }}>
                {form.name}
            </Link>
        ),
    }));


    return (
        <Header
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#001529",
                padding: "0 24px",
                position: "sticky",
                top: 0,
                zIndex: 10,
            }}
        >
            <Space>
                <NavButton to="/" buttonKey="dashboard" icon={<WindowsFilled />}>
                    روش گستر
                </NavButton>
                

                {activeButton === "currentForm" && (
                    <NavButton
                        to={location.pathname}
                        buttonKey="currentForm"
                        icon={<FileTextFilled />}
                        state={{ formName }}
                    >
                        {formName}
                    </NavButton>
                )}
                
                {(activeButton === "manageForms" || activeButton === "currentForm") && (
                    // ✅ تغییر ۲: استفاده از پراپ menu به جای overlay
                    <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                        <Button
                            type="text"
                            icon={<CaretDownFilled />}
                            style={{ color: "#fff" }}
                            title="انتخاب فرم"
                        />
                    </Dropdown>
                )}
            </Space>

            <Space>
                <NavButton to="/manage/forms" buttonKey="manageForms" icon={<SettingOutlined />}>
                    مدیریت فرم‌ها
                </NavButton>
                <Button
                    icon={<LogoutOutlined />}
                    onClick={handleLogout}
                    style={{ color: "#fff" }}
                    type="text"
                >
                    خروج
                </Button>
            </Space>
        </Header>
    );
};

export default AppHeader;