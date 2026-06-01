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
import PageLoader from "../components/PageLoader";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [dashboard, setDashboard] = useState({
    total_carbon: {
      today: 0,
      week: 0,
      month: 0,
      all: 0,
    },
    categories: {
      transport: 0,
      diet: 0,
      energy: 0,
      shopping: 0,
    },
    trend: [],
    recent_activities: [],
    goals: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const categories = dashboard?.categories || {
    transport: 0,
    diet: 0,
    energy: 0,
    shopping: 0,
  };

  const totals = dashboard?.total_carbon || {
    today: 0,
    week: 0,
    month: 0,
    all: 0,
  };

  const chartData = [
    Number(categories.transport || 0),
    Number(categories.diet || 0),
    Number(categories.energy || 0),
    Number(categories.shopping || 0),
  ];

  const trendData = {
    labels: dashboard?.trend?.map((t) => t.date) || [],
    datasets: [
      {
        label: "Carbon Emission",
        data: dashboard?.trend?.map((t) => Number(t.carbon || 0)) || [],
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.raw} kg CO2e`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return `${value} kg`;
          },
        },
      },
    },
  };

  const monthlyGoal = 15;
  const totalMonth = Number(totals.month || 0);

  const percentage = Math.min(
    Math.round((totalMonth / monthlyGoal) * 100),
    100
  );

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

        setDashboard({
          total_carbon: {
            today: Number(res.data?.total_carbon?.today || 0),
            week: Number(res.data?.total_carbon?.week || 0),
            month: Number(res.data?.total_carbon?.month || 0),
            all: Number(res.data?.total_carbon?.all || 0),
          },
          categories: {
            transport: Number(res.data?.categories?.transport || 0),
            diet: Number(res.data?.categories?.diet || 0),
            energy: Number(res.data?.categories?.energy || 0),
            shopping: Number(res.data?.categories?.shopping || 0),
          },
          trend: res.data?.trend || [],
          recent_activities: res.data?.recent_activities || [],
          goals: res.data?.goals || [],
        });
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

  if (loading) return <PageLoader text="Loading dashboard..." />;
  if (error) return <p style={{ padding: "40px", color: "red" }}>{error}</p>;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <div className="dashboard-container">
          <div className="header">
            <div>
              <h1>Welcome back, {user?.name || "User"} 👋</h1>
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

          <div className="top-grid">
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
                  <div className="change-pill">0% vs last month</div>
                </div>
              </div>

              <div className="chart-section">
                <div className="chart-wrapper">
                  <CarbonChart data={chartData} percentage={percentage} />
                </div>

                <div className="legend">
                  <div className="legend-item">
                    <span className="legend-dot dot-green"></span>
                    <span>Transport</span>
                    <strong>{Number(categories.transport || 0).toFixed(2)} kg</strong>
                  </div>

                  <div className="legend-item">
                    <span className="legend-dot dot-blue"></span>
                    <span>Diet</span>
                    <strong>{Number(categories.diet || 0).toFixed(2)} kg</strong>
                  </div>

                  <div className="legend-item">
                    <span className="legend-dot dot-gray"></span>
                    <span>Energy</span>
                    <strong>{Number(categories.energy || 0).toFixed(2)} kg</strong>
                  </div>

                  <div className="legend-item">
                    <span className="legend-dot dot-light"></span>
                    <span>Shopping</span>
                    <strong>{Number(categories.shopping || 0).toFixed(2)} kg</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="goals-card">
              <h3>Current Goals</h3>

              {(dashboard.goals || []).length === 0 && (
                <p className="empty-text">No active goals yet.</p>
              )}

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

          <div className="stats summary-stats">
            <div className="stat-card">
              <h4>Today</h4>
              <p>{Number(totals.today || 0).toFixed(2)} kg</p>
            </div>

            <div className="stat-card">
              <h4>This Week</h4>
              <p>{Number(totals.week || 0).toFixed(2)} kg</p>
            </div>

            <div className="stat-card">
              <h4>This Month</h4>
              <p>{Number(totals.month || 0).toFixed(2)} kg</p>
            </div>
          </div>

          <div className="stats">
            <div className="stat-card">
              <div className="stat-icon">
                <FaCarSide />
              </div>
              <h4>Transport</h4>
              <p>
                {Number(categories.transport || 0).toFixed(2)} <span>kg</span>
              </p>
              <small className="muted-text">Live data</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaUtensils />
              </div>
              <h4>Diet</h4>
              <p>
                {Number(categories.diet || 0).toFixed(2)} <span>kg</span>
              </p>
              <small className="muted-text">Live data</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaBolt />
              </div>
              <h4>Energy</h4>
              <p>
                {Number(categories.energy || 0).toFixed(2)} <span>kg</span>
              </p>
              <small className="muted-text">Live data</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaShoppingBag />
              </div>
              <h4>Shopping</h4>
              <p>
                {Number(categories.shopping || 0).toFixed(2)} <span>kg</span>
              </p>
              <small className="muted-text">Live data</small>
            </div>
          </div>

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

          <div className="dashboard-bottom-grid">
            <div className="trend-card">
              <div className="section-header">
                <div>
                  <h3>Carbon Trend</h3>
                  <p>Last 7 days of tracked emissions</p>
                </div>
              </div>

              <div className="line-chart-wrapper">
                <Line data={trendData} options={trendOptions} />
              </div>
            </div>

            <div className="recent-activities">
              <div className="section-header">
                <div>
                  <h3>Recent Activity</h3>
                  <p>Your latest logged actions</p>
                </div>
              </div>

              {(dashboard?.recent_activities || []).length === 0 && (
                <p className="empty-text">No activities logged yet.</p>
              )}

              {(dashboard?.recent_activities || []).map((item) => (
                <div key={item.id} className="activity-row">
                  <div>
                    <span>{item.category || "Activity"}</span>
                    <small>{item.created_at || "Today"}</small>
                  </div>
                  <strong>{Number(item.carbon_value || 0).toFixed(2)} kg</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}