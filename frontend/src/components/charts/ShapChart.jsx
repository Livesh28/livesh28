import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export const ShapChart = ({ shapValues }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current?.getContext("2d");
    if (!ctx || !shapValues) return;

    // Sort by absolute value and take top 15
    const sortedEntries = Object.entries(shapValues)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 15);

    const labels = sortedEntries.map(([gene]) => gene);
    const values = sortedEntries.map(([, value]) => value);

    // Colors: Blue for positive (increases risk), Red for negative (decreases risk)
    const colors = values.map((v) => (v >= 0 ? "#2563EB" : "#E11D48"));

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "SHAP Value",
            data: values,
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: 0,
            borderRadius: 0,
            barThickness: 20,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Gene Contribution to Prediction",
            font: { family: "Manrope", size: 14, weight: "bold" },
            color: "#09090B",
            padding: { bottom: 20 },
          },
          tooltip: {
            backgroundColor: "#09090B",
            titleFont: { family: "Manrope", weight: "bold" },
            bodyFont: { family: "JetBrains Mono" },
            padding: 12,
            cornerRadius: 4,
            callbacks: {
              label: (context) => {
                const value = context.parsed.x;
                const direction = value >= 0 ? "Increases" : "Decreases";
                return `${direction} risk by ${Math.abs(value).toFixed(3)}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: "#E4E4E7",
              drawBorder: false,
            },
            ticks: {
              font: { family: "JetBrains Mono", size: 10 },
              color: "#52525B",
            },
            title: {
              display: true,
              text: "← Decreases Risk | Increases Risk →",
              font: { family: "JetBrains Mono", size: 10 },
              color: "#A1A1AA",
            },
          },
          y: {
            grid: {
              display: false,
            },
            ticks: {
              font: { family: "JetBrains Mono", size: 10 },
              color: "#09090B",
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [shapValues]);

  if (!shapValues || Object.keys(shapValues).length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-zinc-500 font-mono text-sm">No SHAP data available</p>
      </div>
    );
  }

  return <canvas ref={chartRef} data-testid="shap-chart" />;
};
