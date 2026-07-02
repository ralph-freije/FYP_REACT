import { useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const centerTextPlugin = {
  id: "centerTextPlugin",
  beforeDraw(chart) {
    const { width, height, ctx } = chart;
    ctx.save();

    const centerX = width / 2;
    const centerY = height / 2;

    const percentage = chart.config.options.plugins.centerText?.percentage || 0;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "800 30px system-ui";
    ctx.fillStyle = "#0f172a";
    ctx.fillText(`${percentage}%`, centerX, centerY - 10);

    ctx.font = "700 13px system-ui";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("ACTIVITY", centerX, centerY + 22);

    ctx.restore();
  },
};

export default function CarbonChart({ data, percentage }) {
  const chartData = useMemo(
    () => ({
      labels: ["Transport", "Diet", "Energy", "Shopping"],
      datasets: [
        {
          data: data,
          backgroundColor: ["#10b981", "#3b82f6", "#94a3b8", "#f59e0b"],
          borderWidth: 0,
          hoverOffset: 4,
          borderRadius: 10,
          spacing: 3,
        },
      ],
    }),
    [data]
  );

  const options = useMemo(
    () => ({
      cutout: "74%",
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0f172a",
          titleColor: "#fff",
          bodyColor: "#fff",
          padding: 10,
          displayColors: true,
        },
      },
    }),
    []
  );

  return (
    <div style={{ width: "280px", height: "280px" }}>
      <Doughnut
  data={chartData}
  options={{
    ...options,
    plugins: {
      ...options.plugins,
      centerText: {
        percentage: percentage,
      },
    },
  }}
  plugins={[centerTextPlugin]}
/>
    </div>
  );
}