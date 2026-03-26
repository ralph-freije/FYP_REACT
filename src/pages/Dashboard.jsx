import Sidebar from "../components/Sidebar";
import CarbonChart from "../components/CarbonChart";
import { useEffect, useState } from "react";
import { getDashboard } from "../api/dashboardApi";
import {
  FaCarSide,
  FaUtensils,
  FaBolt,
  FaShoppingBag,
  FaRegLightbulb,
} from "react-icons/fa";
import "./Dashboard.css";
import { getMe } from "../api/authApi";
export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  
 useEffect(() => {
  const loadUser = async () => {
    try {
      const res = await getMe();
      console.log("USER RESPONSE:", res.data);
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDashboard = async () => {
    try {
      const res = await getDashboard();
      setDashboard(res.data);
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
  if (loading) return <p style={{ padding: "40px" }}>Loading dashboard...</p>;

  if (error)
    return <p style={{ padding: "40px", color: "red" }}>{error}</p>;
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <div className="dashboard-container">
          <div className="header">
            <div>
              <h1>
                Welcome back, {user?.name || "User"} 👋
              </h1>
              <p>Here’s your sustainability impact this month.</p>
            </div>

            <div className="header-actions">
              <button className="btn-light">This Month</button>
              <button className="btn-green">+ Log Activity</button>
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
                    <strong>{dashboard.total_carbon}</strong> <span>kg CO2e</span>
                  </div>
                  <div className="change-pill">
                    {dashboard.change}% vs last month
                  </div>
                </div>
              </div>

              <div className="chart-section">
                <div className="chart-wrapper">
                  <CarbonChart data={dashboard.categories} />
                </div>

                <div className="legend">
                  <div className="legend-item">
                    <span className="legend-dot dot-green"></span>
                    <span>Transport</span>
                    <strong>{dashboard.categories.transport}kg</strong>
                  </div>

                  <div className="legend-item">
                    <span className="legend-dot dot-blue"></span>
                    <span>Diet</span>
                    <strong>{dashboard.categories.diet}kg</strong>
                  </div>

                  <div className="legend-item">
                    <span className="legend-dot dot-gray"></span>
                    <span>Energy</span>
                    <strong>{dashboard.categories.energy}kg</strong>
                  </div>

                  <div className="legend-item">
                    <span className="legend-dot dot-light"></span>
                    <span>Shopping</span>
                    <strong>{dashboard.categories.shopping}kg</strong>
                  </div>
                </div>
              </div>

            </div> {/* CLOSE main-card */}

            <div className="goals-card">
              <h3>Current Goals</h3>

              {dashboard.goals.map((goal, i) => (
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
              <div className="stat-icon">
                <FaCarSide />
              </div>
              <h4>Transport</h4>
              <p>{dashboard.categories.transport} <span>kg</span></p>
              <small className="red-text">↑ 4% this week</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaUtensils />
              </div>
              <h4>Diet</h4>
              <p>85 <span>kg</span></p>
              <small className="green-text">↓ 12% this week</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaBolt />
              </div>
              <h4>Energy</h4>
              <p>150 <span>kg</span></p>
              <small className="muted-text">Stable</small>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaShoppingBag />
              </div>
              <h4>Shopping</h4>
              <p>95 <span>kg</span></p>
              <small className="green-text">↓ 8% this week</small>
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
                  <span className="tip-badge gray">Based on your activity</span>
                </div>

                <p>
                  Switching to a meat-free diet just two more days a week could
                  reduce your footprint by another 45kg CO2e this month. Want to
                  try a 7-day plant-based challenge?
                </p>
              </div>
            </div>

            <button className="challenge-btn">Accept Challenge</button>
          </div>
        </div>
      </div>
    </div>
  );
}