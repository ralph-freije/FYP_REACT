import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import PageLoader from "../components/PageLoader";
import { Doughnut, Line, Bar } from "react-chartjs-2";
import "./AdminPage.css";
import RoleDropdown from "../components/RoleDropdown";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import {
  FaUsers,
  FaChartLine,
  FaLeaf,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaSyncAlt,
  FaSearch,
} from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const CATEGORY_COLORS = ["#6366f1", "#10b981", "#a855f7", "#f59e0b", "#ef4444", "#14b8a6"];
const ROLE_COLORS = ["#a855f7", "#10b981"];

const outsideLabelPlugin = {
  id: "outsideLabel",
  afterDatasetsDraw(chart) {
    const { ctx, data } = chart;
    const dataset = chart.getDatasetMeta(0);
    if (!dataset || !dataset.data.length) return;

    const rawValues = data.datasets[0].data.map((v) => Number(v));
    const total = rawValues.reduce((a, b) => a + b, 0);
    if (!total || isNaN(total)) return;

    dataset.data.forEach((arc, index) => {
      const value = rawValues[index];
      if (!value || isNaN(value)) return;

      const percent = ((value / total) * 100).toFixed(1);
      const centerAngle = (arc.startAngle + arc.endAngle) / 2;
      const outerRadius = arc.outerRadius;
      const labelRadius = outerRadius + 26;

      const x = arc.x + Math.cos(centerAngle) * labelRadius;
      const y = arc.y + Math.sin(centerAngle) * labelRadius;

      const color = Array.isArray(data.datasets[0].backgroundColor)
        ? data.datasets[0].backgroundColor[index]
        : "#f1f5f9";

      ctx.save();
      ctx.font = "700 11px system-ui";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${percent}%`, x, y);
      ctx.restore();
    });
  },
};

export default function AdminPage() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "user" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");
      const [analyticsRes, usersRes] = await Promise.all([
        api.get("/auth/admin/analytics"),
        api.get("/auth/admin/users"),
      ]);
      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({ name: user.name || "", email: user.email || "", role: user.role || "user" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", email: "", role: "user" });
  };

  const saveUser = async (id) => {
    try {
      setTableLoading(true);
      await api.put(`/auth/admin/users/${id}`, editForm);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...editForm } : u)));
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update user");
    } finally {
      setTableLoading(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      setTableLoading(true);
      await api.delete(`/auth/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setTableLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" ? true : user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const categoryData = useMemo(() => ({
    labels: Object.keys(analytics?.categories || {}),
    datasets: [{
      data: Object.values(analytics?.categories || {}).map(Number),
      backgroundColor: CATEGORY_COLORS,
      borderColor: "#1e2130",
      borderWidth: 1,
      hoverOffset: 12,
      borderRadius: 10,
      spacing: 4,
    }],
  }), [analytics]);

  const roleData = useMemo(() => ({
    labels: ["Admins", "Users"],
    datasets: [{
      data: [
        Number(analytics?.role_distribution?.admins || 0),
        Number(analytics?.role_distribution?.users || 0),
      ],
      backgroundColor: ROLE_COLORS,
      borderColor: "#1e2130",
      borderWidth: 1,
      hoverOffset: 12,
      borderRadius: 10,
      spacing: 4,
    }],
  }), [analytics]);

  const trendData = useMemo(() => ({
    labels: analytics?.trend?.map((t) => t.date) || [],
    datasets: [{
      label: "Activities",
      data: analytics?.trend?.map((t) => t.count) || [],
      borderColor: "#6366f1",
      backgroundColor: "rgba(99,102,241,0.1)",
      pointBackgroundColor: "#1e2130",
      pointBorderColor: "#6366f1",
      pointBorderWidth: 2,
      pointRadius: 4,
      borderWidth: 2,
      tension: 0.45,
      fill: true,
    }],
  }), [analytics]);

  const userData = useMemo(() => ({
    labels: analytics?.top_users?.map((u) => u.name) || [],
    datasets: [{
      label: "Carbon kg",
      data: analytics?.top_users?.map((u) => Number(u.total)) || [],
      backgroundColor: CATEGORY_COLORS,
      borderRadius: 10,
      barThickness: 32,
    }],
  }), [analytics]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "74%",
    layout: { padding: 32 },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#64748b",
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: { size: 12, weight: "600" },
        },
      },
      tooltip: {
        backgroundColor: "#f7f9fc",
        titleColor: "#000305",
        bodyColor: "#94a3b8",
        borderColor: "#2a2f45",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const rawValues = context.dataset.data.map(Number);
            const total = rawValues.reduce((a, b) => a + b, 0);
            const value = Number(context.parsed);
            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return ` ${context.label}: ${value.toFixed(2)} (${percent}%)`;
          },
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#f0f1f4",
        titleColor: "#000306",
        bodyColor: "#94a3b8",
        borderColor: "#2a2f45",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#475569", font: { size: 12 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(42,47,69,0.8)" },
        ticks: { color: "#475569", font: { size: 12 } },
        border: { display: false },
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#f0f4fb",
        titleColor: "#01070e",
        bodyColor: "#94a3b8",
        borderColor: "#2a2f45",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(42,47,69,0.8)" },
        ticks: { color: "#475569", font: { size: 12 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(42,47,69,0.8)" },
        ticks: { color: "#475569", font: { size: 12 } },
        border: { display: false },
      },
    },
  };

  const totalAdmins = analytics?.role_distribution?.admins || 0;
  const totalNormalUsers = analytics?.role_distribution?.users || 0;
  const totalUsers = analytics?.stats?.users || 0;
  const topCategory = Object.entries(analytics?.categories || {})
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  if (loading) return <PageLoader text="Loading admin analytics..." />;
  if (error) return <p style={{ padding: "40px", color: "#f87171" }}>{error}</p>;

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="admin-main">
        <div className="admin-container">

          <div className="admin-header">
            <div>
              <span className="admin-kicker">System Control Center</span>
              <h1>Admin Analytics</h1>
              <p>Monitor platform usage, users, activities, carbon insights and roles.</p>
            </div>
            <button className="admin-refresh-btn" onClick={loadAll}>
              <FaSyncAlt /> Refresh Data
            </button>
          </div>

          <div className="admin-stats">
            <div className="admin-stat-card">
              <div className="admin-stat-icon blue"><FaUsers /></div>
              <div>
                <h4>Total Users</h4>
                <p>{totalUsers}</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon green"><FaChartLine /></div>
              <div>
                <h4>Total Activities</h4>
                <p>{analytics?.stats?.activities || 0}</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon leaf"><FaLeaf /></div>
              <div>
                <h4>Total Carbon</h4>
                <p>{Number(analytics?.stats?.carbon || 0).toFixed(2)} kg</p>
              </div>
            </div>
          </div>

          <div className="admin-grid">
            <div className="admin-chart-card">
              <div className="admin-card-head">
                <div>
                  <h3>Category Distribution</h3>
                  <span>Emission share by category</span>
                </div>
              </div>
              <div className="admin-chart-small">
                <Doughnut data={categoryData} options={doughnutOptions} plugins={[outsideLabelPlugin]} />
              </div>
            </div>

            <div className="admin-chart-card">
              <div className="admin-card-head">
                <div>
                  <h3>Top Carbon Users</h3>
                  <span>Highest contributors</span>
                </div>
              </div>
              <div className="admin-chart-small">
                <Bar data={userData} options={barOptions} />
              </div>
            </div>
          </div>

          <div className="admin-grid">
            <div className="admin-chart-card">
              <div className="admin-card-head">
                <div>
                  <h3>Role Distribution</h3>
                  <span>Admins vs normal users</span>
                </div>
              </div>
              <div className="admin-chart-small">
                <Doughnut data={roleData} options={doughnutOptions} plugins={[outsideLabelPlugin]} />
              </div>
            </div>

            <div className="admin-chart-card">
              <div className="admin-card-head">
                <div>
                  <h3>System Summary</h3>
                  <span>Quick operational insights</span>
                </div>
              </div>
              <div className="summary-box">
                <div className="summary-item">
                  <strong>Admins</strong>
                  <span style={{ color: "#c084fc", fontWeight: 700 }}>{totalAdmins}</span>
                </div>
                <div className="summary-item">
                  <strong>Users</strong>
                  <span style={{ color: "#34d399", fontWeight: 700 }}>{totalNormalUsers}</span>
                </div>
                <div className="summary-item">
                  <strong>Most Used Category</strong>
                  <span style={{ color: "#818cf8", fontWeight: 700 }}>{topCategory}</span>
                </div>
                <div className="summary-item">
                  <strong>Platform Status</strong>
                  <span style={{ color: "#34d399", fontWeight: 700 }}>● Healthy</span>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-chart-card admin-chart-full">
            <div className="admin-card-head">
              <div>
                <h3>Activity Trend</h3>
                <span>Recorded activity growth</span>
              </div>
            </div>
            <div className="admin-chart-large">
              <Line data={trendData} options={lineOptions} />
            </div>
          </div>

          <div className="admin-chart-card admin-chart-full">
            <div className="admin-card-head">
              <div>
                <h3>Recent Activities Feed</h3>
                <span>Latest system activity</span>
              </div>
            </div>
            <div className="recent-feed">
              {analytics?.recent_activities?.map((item, index) => (
                <div key={index} className="recent-item">
                  <strong>{item.user}</strong>
                  <span style={{ color: "#475569", margin: "0 4px" }}>added</span>
                  <span>{item.category}</span>
                  <span style={{ color: "#475569", margin: "0 4px" }}>—</span>
                  <span style={{ color: "#34d399", fontWeight: 600 }}>{item.carbon} kg</span>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-users-card">
            <div className="admin-card-head">
              <div>
                <h3>User Management</h3>
                <span>Full access to users table</span>
              </div>
              {tableLoading && <span className="saving-pill">Saving...</span>}
            </div>

            <div className="table-toolbar">
              <div className="search-box">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <RoleDropdown
  value={roleFilter}
  onChange={setRoleFilter}
/>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isEditing = editingId === user.id;
                    return (
                      <tr key={user.id}>
                        <td style={{ color: "#475569" }}>{user.id}</td>
                        <td style={{ color: "#f1f5f9", fontWeight: 600 }}>
                          {isEditing ? (
                            <input className="admin-input" value={editForm.name}
                              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                          ) : user.name}
                        </td>
                        <td>
                          {isEditing ? (
                            <input className="admin-input" value={editForm.email}
                              onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
                          ) : user.email}
                        </td>
                        <td>
                          {isEditing ? (
                            <select className="admin-select" value={editForm.role}
                              onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}>
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                          ) : (
                            <span className={`role-badge ${user.role === "admin" ? "admin" : "user"}`}>
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</td>
                        <td>
                          <div className="admin-actions">
                            {isEditing ? (
                              <>
                                <button className="icon-btn save" onClick={() => saveUser(user.id)}><FaSave /></button>
                                <button className="icon-btn cancel" onClick={cancelEdit}><FaTimes /></button>
                              </>
                            ) : (
                              <>
                                <button className="icon-btn edit" onClick={() => startEdit(user)}><FaEdit /></button>
                                <button className="icon-btn delete" onClick={() => deleteUser(user.id)}><FaTrash /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}