import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export const DiseaseChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;

    const labels = Object.keys(data);
    const values = Object.values(data);

    const getColor = (value) => {
      if (value < 30) return "#10B981"; // safe
      if (value < 60) return "#F59E0B"; // warning
      return "#E11D48"; // critical
    };

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Risk %",
            data: values,
            backgroundColor: values.map(getColor),
            borderColor: values.map(getColor),
            borderWidth: 0,
            borderRadius: 0,
            barThickness: 40,
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
          tooltip: {
            backgroundColor: "#09090B",
            titleFont: { family: "Manrope", weight: "bold" },
            bodyFont: { family: "JetBrains Mono" },
            padding: 12,
            cornerRadius: 4,
            callbacks: {
              label: (context) => `Risk: ${context.parsed.x.toFixed(1)}%`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: "#E4E4E7",
              drawBorder: false,
            },
            ticks: {
              font: { family: "JetBrains Mono", size: 11 },
              color: "#52525B",
              callback: (value) => `${value}%`,
            },
          },
          y: {
            grid: {
              display: false,
            },
            ticks: {
              font: { family: "Manrope", size: 12, weight: "500" },
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
  }, [data]);

  return <canvas ref={chartRef} data-testid="disease-chart" />;
};
