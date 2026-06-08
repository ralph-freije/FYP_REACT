import Sidebar from "../components/Sidebar";
import CarbonChart from "../components/CarbonChart";
import { useEffect, useState } from "react";
import { getDashboard } from "../api/dashboardApi";
import { createGoal, deleteGoal } from "../api/goalApi";
import { useNavigate } from "react-router-dom";
import {
  FaCarSide,
  FaUtensils,
  FaBolt,
  FaShoppingBag,
  FaRegLightbulb,
  FaPlus,
  FaTrash,
  FaTimes,
  FaBullseye,
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
import InlineLoader from "../components/InlineLoader";

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

  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalCategory, setGoalCategory] = useState("carbon");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalError, setGoalError] = useState("");
  const [goalLoading, setGoalLoading] = useState(false);

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
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await getMe();
        setUser(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    const init = async () => {
      try {
        await Promise.all([loadDashboard(), loadUser()]);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const resetGoalForm = () => {
    setGoalTitle("");
    setGoalCategory("carbon");
    setGoalTarget("");
    setGoalDeadline("");
    setGoalError("");
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();

    if (!goalTitle.trim()) {
      setGoalError("Please enter a goal title.");
      return;
    }

    if (!goalTarget || Number(goalTarget) <= 0) {
      setGoalError("Please enter a valid target value.");
      return;
    }

    try {
      setGoalLoading(true);
      setGoalError("");

      await createGoal({
        title: goalTitle.trim(),
        category: goalCategory,
        target_value: Number(goalTarget),
        unit: "kg CO2e",
        deadline: goalDeadline || null,
      });

      resetGoalForm();
      setGoalFormOpen(false);
      await loadDashboard();
    } catch (err) {
      console.error(err);
      setGoalError(err.response?.data?.message || "Failed to create goal.");
    } finally {
      setGoalLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    const confirmed = window.confirm("Delete this goal?");

    if (!confirmed) return;

    try {
      setGoalLoading(true);
      await deleteGoal(goalId);
      await loadDashboard();
    } catch (err) {
      console.error(err);
      setGoalError("Failed to delete goal.");
    } finally {
      setGoalLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <div className="dashboard-container">
          {loading ? (
            <InlineLoader
              text="Loading dashboard..."
              subtext="Preparing your sustainability overview."
            />
          ) : error ? (
            <div className="dashboard-error-card">{error}</div>
          ) : (
            <>
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
                      <div className="change-pill">Live monthly data</div>
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
                        <strong>
                          {Number(categories.transport || 0).toFixed(2)} kg
                        </strong>
                      </div>

                      <div className="legend-item">
                        <span className="legend-dot dot-blue"></span>
                        <span>Diet</span>
                        <strong>
                          {Number(categories.diet || 0).toFixed(2)} kg
                        </strong>
                      </div>

                      <div className="legend-item">
                        <span className="legend-dot dot-gray"></span>
                        <span>Energy</span>
                        <strong>
                          {Number(categories.energy || 0).toFixed(2)} kg
                        </strong>
                      </div>

                      <div className="legend-item">
                        <span className="legend-dot dot-yellow"></span>
                        <span>Shopping</span>
                        <strong>
                          {Number(categories.shopping || 0).toFixed(2)} kg
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="stats-column">
                  <div className="stat-card">
                    <div className="stat-icon green-bg">
                      <FaCarSide />
                    </div>
                    <div>
                      <p>Today</p>
                      <h3>{Number(totals.today || 0).toFixed(2)} kg</h3>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon blue-bg">
                      <FaBolt />
                    </div>
                    <div>
                      <p>This Week</p>
                      <h3>{Number(totals.week || 0).toFixed(2)} kg</h3>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon yellow-bg">
                      <FaShoppingBag />
                    </div>
                    <div>
                      <p>All Time</p>
                      <h3>{Number(totals.all || 0).toFixed(2)} kg</h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="dashboard-card trend-card">
                  <div className="section-title">
                    <div>
                      <h3>Emission Trend</h3>
                      <p>Your carbon footprint over the last 7 days.</p>
                    </div>
                  </div>

                  <div className="trend-chart">
                    {dashboard.trend.length > 0 ? (
                      <Line data={trendData} options={trendOptions} />
                    ) : (
                      <div className="empty-state">
                        No trend data yet. Log activities to see your progress.
                      </div>
                    )}
                  </div>
                </div>

                <div className="dashboard-card tips-card">
                  <div className="section-title">
                    <div>
                      <h3>Eco Tip</h3>
                      <p>Small steps that make a difference.</p>
                    </div>
                    <FaRegLightbulb />
                  </div>

                  <div className="tip-box">
                    <h4>Try walking for short trips</h4>
                    <p>
                      Replacing one short car trip with walking can reduce your
                      monthly emissions and improve your health.
                    </p>
                  </div>
                </div>
              </div>

              <div className="goals-section dashboard-card">
                <div className="section-title goals-title-row">
                  <div>
                    <h3>Personal Goals</h3>
                    <p>Create goals and earn achievements when you complete them.</p>
                  </div>

                  <button
                    className="goal-add-btn"
                    onClick={() => {
                      setGoalFormOpen(true);
                      setGoalError("");
                    }}
                  >
                    <FaPlus /> Add Goal
                  </button>
                </div>

                {goalError && <div className="goal-error">{goalError}</div>}

                {goalFormOpen && (
                  <form className="goal-form" onSubmit={handleCreateGoal}>
                    <div className="goal-form-header">
                      <h4>New goal</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setGoalFormOpen(false);
                          resetGoalForm();
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>

                    <div className="goal-form-grid">
                      <input
                        type="text"
                        value={goalTitle}
                        onChange={(e) => setGoalTitle(e.target.value)}
                        placeholder="Goal title"
                      />

                      <select
                        value={goalCategory}
                        onChange={(e) => setGoalCategory(e.target.value)}
                      >
                        <option value="carbon">Carbon</option>
                        <option value="transport">Transport</option>
                        <option value="diet">Diet</option>
                        <option value="energy">Energy</option>
                        <option value="shopping">Shopping</option>
                      </select>

                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={goalTarget}
                        onChange={(e) => setGoalTarget(e.target.value)}
                        placeholder="Target value"
                      />

                      <input
                        type="date"
                        value={goalDeadline}
                        onChange={(e) => setGoalDeadline(e.target.value)}
                      />
                    </div>

                    <button
                      className="goal-save-btn"
                      type="submit"
                      disabled={goalLoading}
                    >
                      {goalLoading ? "Saving..." : "Save Goal"}
                    </button>
                  </form>
                )}

                {dashboard.goals.length === 0 ? (
                  <div className="goals-empty">
                    <FaBullseye />
                    <h4>No goals yet</h4>
                    <p>
                      Add a monthly carbon goal and EcoTrack will track your progress.
                    </p>
                  </div>
                ) : (
                  <div className="goals-list">
                    {dashboard.goals.map((goal) => {
                      const goalPercentage = Math.min(
                        Math.round(Number(goal.progress_percentage || 0)),
                        100
                      );

                      return (
                        <div
                          className={`goal-card ${
                            goal.is_completed ? "completed" : ""
                          }`}
                          key={goal.id}
                        >
                          <div className="goal-card-header">
                            <div>
                              <span>{goal.category}</span>
                              <h4>{goal.title}</h4>
                            </div>

                            <button
                              className="goal-delete-btn"
                              onClick={() => handleDeleteGoal(goal.id)}
                              disabled={goalLoading}
                              title="Delete goal"
                            >
                              <FaTrash />
                            </button>
                          </div>

                          <div className="goal-progress-row">
                            <p>
                              {Number(goal.current_value || 0).toFixed(2)} /{" "}
                              {Number(goal.target_value || 0).toFixed(2)}{" "}
                              {goal.unit || "kg CO2e"}
                            </p>
                            <strong>{goalPercentage}%</strong>
                          </div>

                          <div className="goal-progress-bar">
                            <div style={{ width: `${goalPercentage}%` }}></div>
                          </div>

                          <div className="goal-footer">
                            <span>
                              {goal.deadline
                                ? `Deadline: ${goal.deadline}`
                                : "No deadline"}
                            </span>

                            {goal.is_completed && (
                              <strong className="goal-completed-badge">
                                Completed
                              </strong>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bottom-grid">
                <div className="dashboard-card activity-card">
                  <div className="section-title">
                    <div>
                      <h3>Recent Activities</h3>
                      <p>Latest actions logged into your carbon tracker.</p>
                    </div>
                  </div>

                  <div className="activity-list">
                    {dashboard.recent_activities.length > 0 ? (
                      dashboard.recent_activities.map((activity) => (
                        <div className="activity-row" key={activity.id}>
                          <div
                            className={`activity-icon ${activity.category}`}
                          >
                            {activity.category === "transport" && <FaCarSide />}
                            {activity.category === "diet" && <FaUtensils />}
                            {activity.category === "energy" && <FaBolt />}
                            {activity.category === "shopping" && (
                              <FaShoppingBag />
                            )}
                          </div>

                          <div>
                            <h4>{activity.title}</h4>
                            <p>
                              {activity.category} •{" "}
                              {Number(activity.carbon_value || 0).toFixed(2)} kg
                            </p>
                          </div>

                          <span>{activity.activity_date}</span>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        No activities yet. Start by logging your first activity.
                      </div>
                    )}
                  </div>
                </div>

                <div className="dashboard-card overview-card">
                  <div className="section-title">
                    <div>
                      <h3>Category Summary</h3>
                      <p>Where your emissions are coming from.</p>
                    </div>
                  </div>

                  <div className="summary-list">
                    <div>
                      <span>Transport</span>
                      <strong>
                        {Number(categories.transport || 0).toFixed(2)} kg
                      </strong>
                    </div>

                    <div>
                      <span>Diet</span>
                      <strong>{Number(categories.diet || 0).toFixed(2)} kg</strong>
                    </div>

                    <div>
                      <span>Energy</span>
                      <strong>
                        {Number(categories.energy || 0).toFixed(2)} kg
                      </strong>
                    </div>

                    <div>
                      <span>Shopping</span>
                      <strong>
                        {Number(categories.shopping || 0).toFixed(2)} kg
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}