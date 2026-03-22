import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export const DrugChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current?.getContext("2d");
    if (!ctx || !data) return;

    const labels = Object.keys(data);
    const effectiveData = labels.map((drug) => data[drug].effective);
    const notRecommendedData = labels.map((drug) => data[drug].not_recommended);

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Effective",
            data: effectiveData,
            backgroundColor: "#10B981",
            borderColor: "#10B981",
            borderWidth: 0,
            borderRadius: 0,
          },
          {
            label: "Not Recommended",
            data: notRecommendedData,
            backgroundColor: "#E11D48",
            borderColor: "#E11D48",
            borderWidth: 0,
            borderRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              padding: 15,
              font: { family: "JetBrains Mono", size: 10 },
              color: "#52525B",
            },
          },
          tooltip: {
            backgroundColor: "#09090B",
            titleFont: { family: "Manrope", weight: "bold" },
            bodyFont: { family: "JetBrains Mono" },
            padding: 12,
            cornerRadius: 4,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: { family: "Manrope", size: 11, weight: "500" },
              color: "#09090B",
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "#E4E4E7",
              drawBorder: false,
            },
            ticks: {
              font: { family: "JetBrains Mono", size: 11 },
              color: "#52525B",
              stepSize: 1,
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

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-zinc-500 font-mono text-sm">No drug data available</p>
      </div>
    );
  }

  return <canvas ref={chartRef} data-testid="drug-chart" />;
};
