import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Title } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { getCategoryAnalysis } from "../../services/api";
import ChartControls from "../ChartControls";

ChartJS.register(ArcElement, Tooltip, Title);
ChartJS.defaults.font.family = "Vazirmatn";

const CategoryChart = () => {
    const [period, setPeriod] = useState("month");
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [loading, setLoading] = useState(true);

    const rootStyles = getComputedStyle(document.documentElement);
    const textSecondaryColor = rootStyles.getPropertyValue("--text-primary").trim();

    const PERIOD_OPTIONS = [
        { label: "سالانه", value: "year" },
        { label: "ماهانه", value: "month" },
        { label: "هفتگی", value: "week" },
        { label: "روزانه", value: "day" },
    ];
    const CHART_COLORS = [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
        "#FF9F40",
        "#E7E9ED",
        "#7C8C8D",
        "#1ABC9C",
        "#F1C40F",
        "#7F8C8D",
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getCategoryAnalysis(period);
                if (data && data.length > 0) {
                    setChartData({
                        labels: data.map((item) => item.category),
                        datasets: [
                            {
                                data: data.map((item) => item.total_revenue),
                                backgroundColor: CHART_COLORS,
                                borderWidth: 0,
                                hoverOffset: 0,
                            },
                        ],
                    });
                } else {
                    setChartData({ labels: [], datasets: [] });
                }
            } catch (error) {
                console.error("Error fetching category analysis:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [period]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) =>
                        `${context.label}: ${context.parsed.toLocaleString("fa-IR")} تومان`,
                },
            },
            // ==================================================================
            // ++ تنظیمات نهایی برای نمایش لیبل در کنار هر مقطع
            // ==================================================================
            datalabels: {
                formatter: (value, ctx) => {
                    const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (value / total) * 100 : 0;

                    if (percentage < 3) return null; // برای بخش‌های خیلی کوچک لیبل نمایش نده

                    const label = ctx.chart.data.labels[ctx.dataIndex];
                    const formattedValue = value.toLocaleString("fa-IR");
                    const formattedPercentage = `(${percentage.toFixed(1)}%)`;

                    // برگرداندن یک آرایه از رشته‌ها برای نمایش در یک خط
                    return `${label}: ${formattedValue} ${formattedPercentage}`;
                },
                color: textSecondaryColor,
                font: {
                    weight: "bold",
                    size: 13,
                },
                // ++ تنظیمات موقعیت‌دهی برای قرار گرفتن در بیرون نمودار
                anchor: "start", // نقطه اتصال لیبل به انتهای مقطع است
                align: "end", // لیبل بعد از نقطه اتصال شروع می‌شود
                offset: 25, // فاصله لیبل از لبه نمودار
                textAlign: "right",
            },
        },
        cutout: "55%",
    };

    return (
        <>
            <div className="chart-header-controls">
                <ChartControls
                    options={PERIOD_OPTIONS}
                    selectedOption={period}
                    onOptionChange={setPeriod}
                />
            </div>
            <div
                className="chart-canvas-wrapper" style={{ marginTop: '-1rem', width: '100%' }}
            >
                {loading ? (
                    <div className="loading-placeholder">در حال بارگذاری...</div>
                ) : chartData.labels.length > 0 ? (
                    <Doughnut options={options} data={chartData} plugins={[ChartDataLabels]} />
                ) : (
                    <div className="loading-placeholder">داده‌ای برای این بازه زمانی یافت نشد.</div>
                )}
            </div>
        </>
    );
};

export default CategoryChart;