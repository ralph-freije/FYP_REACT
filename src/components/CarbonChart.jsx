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

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "700 20px system-ui";
    ctx.fillStyle = "#0f172a";
    ctx.fillText("75%", centerX, centerY - 8);

    ctx.font = "600 10px system-ui";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("OF GOAL", centerX, centerY + 16);

    ctx.restore();
  },
};

export default function CarbonChart() {
  const data = useMemo(
    () => ({
      labels: ["Transport", "Diet", "Energy", "Shopping"],
      datasets: [
        {
          data: [120, 80, 200, 60],
          backgroundColor: ["#57b12d", "#2f8fdd", "#1f8b3d", "#dbe4ef"],
          borderWidth: 0,
          hoverOffset: 4,
          borderRadius: 10,
          spacing: 3,
        },
      ],
    }),
    []
  );

  const options = useMemo(
    () => ({
      cutout: "72%",
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
    <div style={{ width: "190px", height: "190px" }}>
      <Doughnut
        data={data}
        options={options}
        plugins={[centerTextPlugin]}
      />
    </div>
  );
}