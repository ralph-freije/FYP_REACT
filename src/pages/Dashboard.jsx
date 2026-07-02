import Sidebar from "../components/Sidebar";
import DashboardBackButton from "../components/DashboardBackButton";
import { useEffect, useState } from "react";
import { getDashboard } from "../api/dashboardApi";
import { createGoal, deleteGoal, suggestGoalDetails } from "../api/goalApi";
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
  FaTrophy,
  FaStar,
  FaMedal,
  FaCalendarDay,
  FaCalendarWeek,
  FaHistory,
  FaCoins,
  FaMagic,
  FaChartLine,
  FaUsers,
  FaFire,
  FaTasks,
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
import UserAvatar from "../components/UserAvatar";

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
    game_profile: {
      total_score: 0,
      level: 1,
      current_level_score: 0,
      next_level_score: 500,
      level_progress: 0,
      total_completed_goals: 0,
      total_completed_challenges: 0,
      recent_score_history: [],
    },
    mini_leaderboards: {
      users: [],
      communities: [],
    },
    challenge_stats: {
      completed_today: 0,
      completed_week: 0,
      completed_month: 0,
      completed_total: 0,
      challenge_score: 0,
      streak_days: 0,
      next_multiplier: 1,
    },
  });

  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalCategory, setGoalCategory] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalError, setGoalError] = useState("");
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalAiFilling, setGoalAiFilling] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const getGoalErrorMessage = (err, fallback = "Failed to create goal.") => {
    const data = err?.response?.data;

    if (data?.errors) {
      const firstError = Object.values(data.errors)
        .flat()
        .filter(Boolean)[0];

      if (firstError) return firstError;
    }

    if (data?.message) {
      const similarTitle = data?.similar_goal_title || data?.similar_goal?.title;

      if (similarTitle && !data.message.includes(similarTitle)) {
        return `${data.message} Similar goal: ${similarTitle}.`;
      }

      return data.message;
    }

    return fallback;
  };

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

  const gameProfile = dashboard?.game_profile || {
    total_score: 0,
    level: 1,
    current_level_score: 0,
    next_level_score: 500,
    level_progress: 0,
    total_completed_goals: 0,
    total_completed_challenges: 0,
    recent_score_history: [],
  };

  const miniLeaderboards = dashboard?.mini_leaderboards || {
    users: [],
    communities: [],
  };

  const challengeStats = dashboard?.challenge_stats || {
    completed_today: 0,
    completed_week: 0,
    completed_month: 0,
    completed_total: 0,
    challenge_score: 0,
    streak_days: 0,
    next_multiplier: 1,
  };

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

  const totalMonth = Number(totals.month || 0);
  const playerName = user?.name || user?.username || user?.email?.split("@")[0] || "Eco Hero";
  const playerPhoto =
    user?.profile_picture ||
    user?.profile?.profile_picture ||
    user?.avatar ||
    user?.profile?.avatar ||
    null;

  const skillRows = [
    {
      key: "transport",
      label: "Transport",
      icon: <FaCarSide />,
      value: Number(categories.transport || 0),
      rank: "Mobility",
    },
    {
      key: "diet",
      label: "Diet",
      icon: <FaUtensils />,
      value: Number(categories.diet || 0),
      rank: "Nutrition",
    },
    {
      key: "energy",
      label: "Energy",
      icon: <FaBolt />,
      value: Number(categories.energy || 0),
      rank: "Power",
    },
    {
      key: "shopping",
      label: "Shopping",
      icon: <FaShoppingBag />,
      value: Number(categories.shopping || 0),
      rank: "Items",
    },
  ];

  const maxSkillValue = Math.max(...skillRows.map((skill) => skill.value), 1);

  const statusRows = [
    {
      key: "month",
      label: "Month CO₂",
      value: `${totalMonth.toFixed(2)} kg`,
      note: "Live monthly total",
      icon: <FaChartLine />,
      tone: "accent",
    },
    {
      key: "today",
      label: "Today",
      value: `${Number(totals.today || 0).toFixed(2)} kg`,
      note: "Current day",
      icon: <FaCalendarDay />,
    },
    {
      key: "week",
      label: "This Week",
      value: `${Number(totals.week || 0).toFixed(2)} kg`,
      note: "Weekly impact",
      icon: <FaCalendarWeek />,
    },
    {
      key: "all",
      label: "All Time",
      value: `${Number(totals.all || 0).toFixed(2)} kg`,
      note: "Total tracked",
      icon: <FaHistory />,
    },
    {
      key: "goals",
      label: "Goals",
      value: Number(gameProfile.total_completed_goals || 0).toLocaleString(),
      note: "Completed",
      icon: <FaBullseye />,
    },
    {
      key: "quests",
      label: "Quests",
      value: Number(gameProfile.total_completed_challenges || 0).toLocaleString(),
      note: "Completed",
      icon: <FaTasks />,
      tone: "quest",
    },
  ];

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
        goals: res.data?.personal_goals || res.data?.goals || [],
        game_profile: res.data?.game_profile || {
          total_score: 0,
          level: 1,
          current_level_score: 0,
          next_level_score: 500,
          level_progress: 0,
          total_completed_goals: 0,
          total_completed_challenges: 0,
          recent_score_history: [],
        },
        mini_leaderboards: res.data?.mini_leaderboards || {
          users: [],
          communities: [],
        },
        challenge_stats: res.data?.challenge_stats || {
          completed_today: 0,
          completed_week: 0,
          completed_month: 0,
          completed_total: 0,
          challenge_score: 0,
          streak_days: 0,
          next_multiplier: 1,
        },
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
    setGoalDescription("");
    setGoalCategory("");
    setGoalTarget("");
    setGoalError("");
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();

    if (!goalTitle.trim()) {
      setGoalError("Please enter a goal title.");
      return;
    }


    try {
      setGoalLoading(true);
      setGoalError("");

      await createGoal({
        title: goalTitle.trim(),
        description: goalDescription.trim() || null,
        category: goalCategory || null,
        target: goalTarget.trim() || null,
      });

      resetGoalForm();
      setGoalFormOpen(false);
      await loadDashboard();
    } catch (err) {
      console.error(err);
      setGoalFormOpen(true);
      setGoalError(getGoalErrorMessage(err, "Failed to create goal."));
    } finally {
      setGoalLoading(false);
    }
  };

  const handleFillGoalWithAi = async () => {
    if (!goalTitle.trim()) {
      setGoalError("Write a goal title first, then AI can fill the rest.");
      return;
    }

    try {
      setGoalAiFilling(true);
      setGoalError("");

      const suggestion = await suggestGoalDetails({
        title: goalTitle.trim(),
      });

      setGoalDescription(suggestion.description || "");
      setGoalCategory(suggestion.category || "custom");
      setGoalTarget(suggestion.target || "");
    } catch (err) {
      console.error(err);
      setGoalError(getGoalErrorMessage(err, "AI could not fill the goal details."));
    } finally {
      setGoalAiFilling(false);
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
      alert("Failed to delete goal.");
    } finally {
      setGoalLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <DashboardBackButton />
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
                  <button
                    className="btn-green"
                    onClick={() => navigate("/activity")}
                  >
                    + Log Activity
                  </button>
                </div>
              </div>

              <div className="top-grid dashboard-hero-grid">
                <div className="jrpg-status-card">
                  <div className="jrpg-card-top">
                    <div className="jrpg-title-block">
                      <span className="jrpg-kicker"><FaStar /> EcoTrack Status</span>
                      <h3>Level {Number(gameProfile.level || 1)} {playerName}</h3>
                      <p>Final Fantasy style status for your carbon, score, streak, goals, and daily quests.</p>
                    </div>
                    <div className="jrpg-rank-badge">
                      <FaMedal />
                      <span>EcoScore</span>
                      <strong>{Number(gameProfile.total_score || 0).toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="jrpg-main-row">
                    <div className="jrpg-avatar-frame">
                      <UserAvatar
                        src={playerPhoto}
                        name={playerName}
                        className="jrpg-user-avatar"
                        imageClassName="jrpg-user-avatar-image"
                        fallbackClassName="jrpg-user-avatar-fallback"
                      />
                      <span>{playerName}</span>
                    </div>

                    <div className="jrpg-bars">
                      <div className="jrpg-bar-head">
                        <span>XP to next level</span>
                        <strong>{Math.min(100, Number(gameProfile.level_progress || 0))}%</strong>
                      </div>
                      <div className="jrpg-xp-bar">
                        <div style={{ width: `${Math.min(100, Number(gameProfile.level_progress || 0))}%` }}></div>
                      </div>
                      <div className="jrpg-xp-meta">
                        <span>{Number(gameProfile.current_level_score || gameProfile.total_score || 0).toLocaleString()} pts</span>
                        <strong>{Number(gameProfile.next_level_score || 500).toLocaleString()} pts</strong>
                      </div>
                    </div>
                  </div>

                  <div className="jrpg-stat-menu" aria-label="EcoTrack status values">
                    <div className="jrpg-stat-menu-head">
                      <span>Status Window</span>
                      <strong>Core stats</strong>
                    </div>

                    <div className="jrpg-stat-list">
                      {statusRows.map((stat) => (
                        <div className={`jrpg-stat-line ${stat.tone || ""}`} key={stat.key}>
                          <div className="jrpg-stat-label">
                            <i>{stat.icon}</i>
                            <div>
                              <span>{stat.label}</span>
                              <small>{stat.note}</small>
                            </div>
                          </div>
                          <strong>{stat.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="jrpg-skills-panel">
                    <div className="jrpg-skills-header">
                      <span>Skills</span>
                      <strong>Carbon classes</strong>
                    </div>
                    <div className="jrpg-skills-list">
                      {skillRows.map((skill) => {
                        const fill = Math.min(100, Math.max(8, (skill.value / maxSkillValue) * 100));

                        return (
                          <div className="jrpg-skill-row" key={skill.key}>
                            <div className="jrpg-skill-name">
                              <i>{skill.icon}</i>
                              <div>
                                <span>{skill.label}</span>
                                <small>{skill.rank}</small>
                              </div>
                            </div>
                            <div className="jrpg-skill-meter">
                              <div style={{ width: `${fill}%` }}></div>
                            </div>
                            <strong>{skill.value.toFixed(2)} kg</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="jrpg-actions">
                    <button type="button" onClick={() => navigate("/activity")}>+ Log Activity</button>
                    <button type="button" onClick={() => navigate("/challenges")}>Open Daily Quests</button>
                  </div>
                </div>

                <div className="stats-column compact-side-column">
                  <div className="dashboard-card challenge-stats-card compact-card">
                    <div className="challenge-stats-card-head">
                      <div className="stat-icon green-bg">
                        <FaTasks />
                      </div>
                      <div>
                        <p>Daily Challenges</p>
                        <h3>{Number(challengeStats.completed_today || 0)}/5 today</h3>
                      </div>
                    </div>
                    <div className="challenge-stats-grid compact-stats-grid">
                      <span><strong>{Number(challengeStats.completed_week || 0)}</strong> week</span>
                      <span><strong>{Number(challengeStats.completed_total || 0)}</strong> total</span>
                      <span><strong>{Number(challengeStats.challenge_score || 0).toLocaleString()}</strong> score</span>
                      <span><strong>x{Number(challengeStats.next_multiplier || 1).toFixed(2)}</strong> next</span>
                    </div>
                    <button type="button" className="challenge-dashboard-link" onClick={() => navigate("/challenges")}>
                      <FaFire /> {Number(challengeStats.streak_days || 0)} day streak · Open challenges
                    </button>
                  </div>

                  <div className="dashboard-card mini-leaderboard-card compact-card">
                    <div className="mini-leaderboard-header">
                      <div>
                        <p>Live ranking</p>
                        <h3><FaTrophy /> Mini Leaderboard</h3>
                      </div>
                      <button type="button" onClick={() => navigate("/leaderboards")}>View all</button>
                    </div>

                    <div className="mini-leaderboard-tabs">
                      <span><FaUsers /> Users</span>
                      <strong>{miniLeaderboards.users?.[0]?.name || "No score yet"}</strong>
                    </div>

                    <div className="mini-leaderboard-list">
                      {(miniLeaderboards.users || []).slice(0, 3).length > 0 ? (
                        (miniLeaderboards.users || []).slice(0, 3).map((rankedUser) => (
                          <div className="mini-leaderboard-row" key={`user-${rankedUser.user_id}`}>
                            <span className="mini-rank">#{rankedUser.rank}</span>
                            <UserAvatar
                              src={rankedUser.profile_picture}
                              name={rankedUser.name}
                              className="mini-leaderboard-avatar"
                            />
                            <div>
                              <strong>{rankedUser.name}</strong>
                              <small>Level {rankedUser.level || 1}</small>
                            </div>
                            <b>{Number(rankedUser.total_score || 0).toLocaleString()}</b>
                          </div>
                        ))
                      ) : (
                        <div className="mini-leaderboard-empty">Complete a goal to enter the ranking.</div>
                      )}
                    </div>

                    {(miniLeaderboards.communities || []).slice(0, 1).map((community) => (
                      <div className="mini-community-winner" key={`community-${community.community_id}`}>
                        <FaChartLine />
                        <span>Top community</span>
                        <strong>{community.name}</strong>
                        <b>{Number(community.total_score || 0).toLocaleString()} pts</b>
                      </div>
                    ))}
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

                {goalFormOpen && (
                  <div className="goal-modal-backdrop" role="dialog" aria-modal="true">
                    <form className="goal-modal" onSubmit={handleCreateGoal}>
                      <div className="goal-form-header">
                        <div>
                          <span className="ai-check-pill"><FaMagic /> Create goal</span>
                          <h4>Create personal goal</h4>
                          <p>Write only the title, then AI can fill the description, category, and target while estimating the score reward.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setGoalFormOpen(false);
                            resetGoalForm();
                          }}
                          aria-label="Close goal modal"
                        >
                          <FaTimes />
                        </button>
                      </div>

                      {goalError && (
                        <div className="goal-error goal-modal-error">
                          {goalError}
                        </div>
                      )}

                      <div className="goal-form-stack">
                        <label>
                          <span className="goal-title-label-row">
                            Goal title
                            <button
                              type="button"
                              className="ai-fill-goal-btn"
                              onClick={handleFillGoalWithAi}
                              disabled={goalAiFilling || goalLoading || !goalTitle.trim()}
                            >
                              <FaMagic /> {goalAiFilling ? "Filling..." : "Fill by AI"}
                            </button>
                          </span>
                          <input
                            type="text"
                            value={goalTitle}
                            onChange={(e) => setGoalTitle(e.target.value)}
                            placeholder="Example: Walk instead of using the car"
                          />
                        </label>

                        <label>
                          Description
                          <textarea
                            value={goalDescription}
                            onChange={(e) => setGoalDescription(e.target.value)}
                            placeholder="Explain what you want to do and why it matters."
                            rows="3"
                          />
                        </label>

                        <div className="goal-form-grid personal-goal-grid">
                          <label>
                            Category
                            <select
                              value={goalCategory}
                              onChange={(e) => setGoalCategory(e.target.value)}
                            >
                              <option value="">AI chooses</option>
                              <option value="transport">Transport</option>
                              <option value="diet">Diet</option>
                              <option value="energy">Energy</option>
                              <option value="shopping">Shopping</option>
                              <option value="waste">Waste</option>
                              <option value="water">Water</option>
                              <option value="reuse">Reuse</option>
                              <option value="carbon">Carbon</option>
                              <option value="custom">Custom</option>
                            </select>
                          </label>

                          <label>
                            Target
                            <input
                              type="text"
                              value={goalTarget}
                              onChange={(e) => setGoalTarget(e.target.value)}
                              placeholder="Example: Complete 8 low-carbon activities"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="goal-modal-actions">
                        <button
                          type="button"
                          className="goal-cancel-btn"
                          onClick={() => {
                            setGoalFormOpen(false);
                            resetGoalForm();
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          className="goal-save-btn"
                          type="submit"
                          disabled={goalLoading}
                        >
                          {goalLoading ? "Creating..." : "Create Goal"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {dashboard.goals.length === 0 ? (
                  <div className="goals-empty">
                    <FaBullseye />
                    <h4>No goals yet</h4>
                    <p>
                      Add a title and let EcoTrack AI fill the details and reward.
                    </p>
                  </div>
                ) : (
                  <div className="goals-list">
                    {dashboard.goals.map((goal) => {
                      const goalPercentage = Math.min(
                        Math.round(Number(goal.progress || goal.progress_percentage || 0)),
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

                          {goal.description && <p className="goal-description">{goal.description}</p>}

                          <div className="goal-reward-row">
                            <span className={`difficulty-badge ${goal.ai_difficulty || "medium"}`}>
                              {goal.ai_difficulty || "medium"}
                            </span>
                            <strong className="score-reward-badge"><FaCoins /> {Number(goal.score_reward || 0)} pts</strong>
                          </div>

                          <div className="goal-target-box">
                            <span>Target</span>
                            <strong>{goal.target || "Personal progress"}</strong>
                          </div>

                          <div className="goal-progress-row">
                            <p>Progress</p>
                            <strong>{goalPercentage}%</strong>
                          </div>

                          <div className="goal-progress-bar">
                            <div style={{ width: `${goalPercentage}%` }}></div>
                          </div>

                          {goal.is_completed && (
                            <div className="goal-footer">
                              <strong className="goal-completed-badge">
                                Completed
                              </strong>
                            </div>
                          )}
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
                            <h4>{activity.title || `${activity.category || "Activity"} activity`}</h4>
                            <p>
                              {activity.category} •{" "}
                              {Number(activity.carbon_value || 0).toFixed(2)} kg
                            </p>
                          </div>

                          <span>{activity.activity_date || activity.created_at}</span>
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