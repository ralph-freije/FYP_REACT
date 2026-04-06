import Sidebar from "../components/Sidebar";
import CarbonChart from "../components/CarbonChart";
import { useEffect, useState } from "react";
import { getDashboard } from "../api/dashboardApi";
import { useNavigate } from "react-router-dom";
import {
  FaCarSide,
  FaUtensils,
  FaBolt,
  FaShoppingBag,
  FaRegLightbulb,
} from "react-icons/fa";
import "./Dashboard.css";
import { getMe } from "../api/authApi";
import { useMemo } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
export default function Dashboard() {
  ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);
  const [dashboard, setDashboard] = useState({
    total_carbon: 0,
    categories: {
      transport: 0,
      diet: 0,
      energy: 0,
      shopping: 0,
    },
  });
  const navigate = useNavigate();
  const chartData = [
    Number(dashboard.categories.transport),
    Number(dashboard.categories.diet),
    Number(dashboard.categories.energy),
    Number(dashboard.categories.shopping),
  ];
  const trendData = {
  labels: dashboard?.trend?.map((t) => t.date) || [],
  datasets: [
    {
      label: "Carbon Emission",
      data: dashboard?.trend?.map((t) => Number(t.carbon)) || [],
      tension: 0.4,
    },
  ],
};
  const goal = 15; // temporary monthly goal

  const totalMonth = dashboard?.total_carbon?.month || 0;

  const percentage = Math.min(
    Math.round((totalMonth / goal) * 100),
    100
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await getMe();
        setUser(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const loadDashboard = async () => {
      try {
        const res = await getDashboard();
        setDashboard(res.data || {});
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    loadUser();
  }, []);

  // ✅ FIXED LOADING (no duplicates)
  if (loading) return <p style={{ padding: "40px" }}>Loading dashboard...</p>;
  if (error) return <p style={{ padding: "40px", color: "red" }}>{error}</p>;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <div className="dashboard-container">
          {/* HEADER */}
          <div className="header">
            <div>
              <h1>
                Welcome back, {user?.name || "User"} 👋
              </h1>
              <p>Here’s your sustainability impact this month.</p>
            </div>

            <div className="header-actions">
              <button className="btn-light">This Month</button>
              <button
                className="btn-green"
                onClick={() => navigate("/activity")}
              >
                + Log Activity
              </button>
            </div>
          </div>

          {/* TOP GRID */}
          <div className="top-grid">
            {/* MAIN CARD */}
            <div className="main-card">
              <div className="card-header">
                <div>
                  <h3>Carbon Footprint</h3>
                  <span className="subtle-text">
                    Monthly overview of CO2 emission
                  </span>
                </div>

                <div className="carbon-value">
                  <div className="carbon-number">
                    <strong>{totalMonth.toFixed(2)}</strong>{" "}
                    <span>kg CO2e</span>
                  </div>
                  <div className="change-pill">
                    0% vs last month
                  </div>
                </div>
              </div>

              {/* CHART */}
              <div className="chart-section">
                <div className="chart-wrapper">
                  <CarbonChart data={chartData} percentage={percentage} />
                </div>

                {/* LEGEND */}
                <div className="legend">
                  <div className="legend-item">
                    <span className="legend-dot dot-green"></span>
                    <span>Transport</span>
                    <strong>
                      {Number(dashboard.categories.transport).toFixed(2)} kg
                    </strong>
                  </div>

                  <div className="legend-item">
                    <span className="legend-dot dot-blue"></span>
                    <span>Diet</span>
                    <strong>
                      {Number(dashboard.categories.diet).toFixed(2)} kg
                    </strong>
                  </div>

                  <div className="legend-item">
                    <span className="legend-dot dot-gray"></span>
                    <span>Energy</span>
                    <strong>
                      {Number(dashboard.categories.energy).toFixed(2)} kg
                    </strong>
                  </div>

                  <div className="legend-item">
                    <span className="legend-dot dot-light"></span>
                    <span>Shopping</span>
                    <strong>
                      {Number(dashboard.categories.shopping).toFixed(2)} kg
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* GOALS */}
            <div className="goals-card">
              <h3>Current Goals</h3>

              {(dashboard.goals || []).map((goal, i) => (
                <div className="goal" key={i}>
                  <div className="goal-row">
                    <span>{goal.name}</span>
                    <strong>{goal.progress}%</strong>
                  </div>

                  <div className="progress">
                    <div style={{ width: `${goal.progress}%` }}></div>
                  </div>
                </div>
              ))}

              <button className="goal-add-btn">+ Add New Goal</button>
            </div>
          </div>
          <div className="stats">
            <div className="stat-card">
              <h4>Today</h4>
              <p>{Number(dashboard?.total_carbon?.today || 0).toFixed(2)} kg</p>
            </div>

            <div className="stat-card">
              <h4>This Week</h4>
              <p>{Number(dashboard?.total_carbon?.week || 0).toFixed(2)} kg</p>
            </div>

            <div className="stat-card">
              <h4>This Month</h4>
              <p>{Number(dashboard?.total_carbon?.month || 0).toFixed(2)} kg</p>
            </div>
          </div>
          {/* STATS */}
          <div className="stats">
            <div className="stat-card">
              <div className="stat-icon">
                <FaCarSide />
              </div>
              <h4>Transport</h4>
              <p>
                {Number(dashboard.categories.transport).toFixed(2)}{" "}
                <span>kg</span>
              </p>
              <small className="muted-text">Live data</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaUtensils />
              </div>
              <h4>Diet</h4>
              <p>
                {Number(dashboard.categories.diet).toFixed(2)}{" "}
                <span>kg</span>
              </p>
              <small className="muted-text">Live data</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaBolt />
              </div>
              <h4>Energy</h4>
              <p>
                {Number(dashboard.categories.energy).toFixed(2)}{" "}
                <span>kg</span>
              </p>
              <small className="muted-text">Live data</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaShoppingBag />
              </div>
              <h4>Shopping</h4>
              <p>
                {Number(dashboard.categories.shopping).toFixed(2)}{" "}
                <span>kg</span>
              </p>
              <small className="muted-text">Live data</small>
            </div>
          </div>

          {/* AI TIP */}
          <div className="ai-tip">
            <div className="ai-tip-left">
              <div className="tip-icon">
                <FaRegLightbulb />
              </div>

              <div>
                <div className="tip-badges">
                  <span className="tip-badge blue">AI SMART TIP</span>
                  <span className="tip-badge gray">
                    Based on your activity
                  </span>
                </div>

                <p>
                  Switching to a meat-free diet just two more days a week could
                  reduce your footprint by another 45kg CO2e this month.
                </p>
              </div>
            </div>

            <button className="challenge-btn">Accept Challenge</button>
          </div>
        </div>
        <div className="trend-card">
  <h3>Carbon Trend (Last 7 Days)</h3>
  <Line data={trendData} key={JSON.stringify(trendData)} />
</div>
<div className="recent-activities">
  <h3>Recent Activity</h3>

  {dashboard?.recent_activities?.map((item) => (
    <div key={item.id} className="activity-row">
      <span>{item.category}</span>
      <strong>{Number(item.carbon_value).toFixed(2)} kg</strong>
    </div>
  ))}
</div>
      </div>
    </div>
  );
}