import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export const TrendChart = ({ predictions }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current?.getContext("2d");
    if (!ctx || !predictions || predictions.length === 0) return;

    // Get last 10 predictions
    const recentPredictions = predictions.slice(0, 10).reverse();
    const labels = recentPredictions.map((_, i) => `#${i + 1}`);

    // Extract data for each disease
    const diseases = ["Cancer", "Diabetes", "Heart Disease", "Alzheimer's", "Hypertension"];
    const colors = ["#E11D48", "#F59E0B", "#2563EB", "#8B5CF6", "#10B981"];

    const datasets = diseases.map((disease, index) => ({
      label: disease,
      data: recentPredictions.map(
        (p) => p.disease_predictions?.[disease] || 0
      ),
      borderColor: colors[index],
      backgroundColor: colors[index] + "20",
      tension: 0.3,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
    }));

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
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
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: { family: "JetBrains Mono", size: 11 },
              color: "#52525B",
            },
          },
          y: {
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
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [predictions]);

  if (!predictions || predictions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-zinc-500 font-mono text-sm">No trend data available</p>
      </div>
    );
  }

  return <canvas ref={chartRef} data-testid="trend-chart" />;
};
