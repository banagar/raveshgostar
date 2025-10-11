// src/hooks/useBreakpoint.js

import { useState, useEffect } from 'react';
import { theme } from 'antd';

const { useToken } = theme;

// یک آبجکت مقادیر پیش‌فرض برای مواقعی که توکن antd هنوز آماده نیست
const defaultBreakpoints = {
    xs: 480,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1600,
};

const useBreakpoint = (breakpoint = 'md') => {
    const { token } = useToken();

    // ✅ بررسی می‌کنیم که آیا token.screen وجود دارد یا نه. اگر نبود از مقادیر پیش‌فرض استفاده می‌کنیم
    const screens = token.screen || defaultBreakpoints;
    const breakpointValue = screens[breakpoint] || defaultBreakpoints[breakpoint];

    const [isLarger, setIsLarger] = useState(
        window.innerWidth >= breakpointValue
    );

    useEffect(() => {
        const handleResize = () => {
            const currentBreakpointValue = (token.screen || defaultBreakpoints)[breakpoint];
            setIsLarger(window.innerWidth >= currentBreakpointValue);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [token, breakpoint]);

    return isLarger;
};

export default useBreakpoint;