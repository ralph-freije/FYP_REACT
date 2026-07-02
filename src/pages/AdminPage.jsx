import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import DashboardBackButton from "../components/DashboardBackButton";
import { Doughnut, Line, Bar } from "react-chartjs-2";
import { getProductImage, handleProductImageError } from "../utils/productImages";
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
  FaStore,
  FaBoxOpen,
  FaShoppingBag,
  FaDollarSign,
  FaBan,
  FaUserCheck,
  FaShieldAlt,
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

const CATEGORY_COLORS = ["#006c49", "#10b981", "#396756", "#005ac2", "#4edea3", "#a0d1bc"];
const ROLE_COLORS = ["#005ac2", "#10b981"];

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
        : "#006c49";

      ctx.save();
      ctx.font = "700 11px Plus Jakarta Sans, system-ui";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${percent}%`, x, y);
      ctx.restore();
    });
  },
};

const formatMoney = (value) => {
  const numeric = Number(value || 0);
  if (numeric >= 1000000) return `$${(numeric / 1000000).toFixed(1)}M`;
  if (numeric >= 1000) return `$${(numeric / 1000).toFixed(1)}K`;
  return `$${numeric.toFixed(2)}`;
};

const formatNumber = (value) => Number(value || 0).toLocaleString();

export default function AdminPage() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "user", status: "active" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [analyticsResult, usersResult] = await Promise.allSettled([
        api.get("/auth/admin/analytics"),
        api.get("/auth/admin/users"),
      ]);

      if (analyticsResult.status === "fulfilled") {
        setAnalytics(analyticsResult.value.data || {});
      } else {
        console.error("Analytics request failed", analyticsResult.reason);
        const backendMessage = analyticsResult.reason?.response?.data?.message;
        setAnalytics(null);
        setError(backendMessage || "Failed to load admin analytics. Run php artisan migrate, then php artisan optimize:clear.");
      }

      if (usersResult.status === "fulfilled") {
        setUsers(Array.isArray(usersResult.value.data) ? usersResult.value.data : []);
      } else {
        console.error("Admin users request failed", usersResult.reason);
        setUsers([]);
        if (analyticsResult.status === "fulfilled") {
          const backendMessage = usersResult.reason?.response?.data?.message;
          setError(backendMessage || "Analytics loaded, but users could not be loaded. Run php artisan migrate, then php artisan optimize:clear.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "user",
      status: user.status || "active",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", email: "", role: "user", status: "active" });
  };

  const saveUser = async (id) => {
    try {
      setTableLoading(true);
      const response = await api.put(`/auth/admin/users/${id}`, editForm);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...(response.data?.user || editForm) } : u)));
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update user");
    } finally {
      setTableLoading(false);
    }
  };

  const setUserStatus = async (user, status) => {
    const action = status === "suspended" ? "suspend" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} ${user.name || user.email}?`)) return;

    try {
      setTableLoading(true);
      const response = await api.put(`/auth/admin/users/${user.id}`, {
        name: user.name,
        email: user.email,
        role: user.role,
        status,
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...(response.data?.user || {}), status } : u)));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || `Failed to ${action} user`);
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

  const marketplace = analytics?.marketplace || {};
  const storeAnalytics = marketplace?.stores || {};
  const productAnalytics = marketplace?.products || {};
  const topStores = marketplace?.top_stores || [];
  const topProducts = marketplace?.top_products_by_carbon || [];

  const categoryData = useMemo(() => ({
    labels: Object.keys(analytics?.categories || {}),
    datasets: [{
      data: Object.values(analytics?.categories || {}).map(Number),
      backgroundColor: CATEGORY_COLORS,
      borderColor: "#ffffff",
      borderWidth: 2,
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
      borderColor: "#ffffff",
      borderWidth: 2,
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
      borderColor: "#006c49",
      backgroundColor: "rgba(16, 185, 129, 0.13)",
      pointBackgroundColor: "#ffffff",
      pointBorderColor: "#006c49",
      pointBorderWidth: 2,
      pointRadius: 4,
      borderWidth: 3,
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
          color: "#3c4a42",
          usePointStyle: true,
          pointStyle: "circle",
          padding: 18,
          font: { size: 12, weight: "600" },
        },
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#131b2e",
        bodyColor: "#3c4a42",
        borderColor: "#bbcabf",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
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
        backgroundColor: "#ffffff",
        titleColor: "#131b2e",
        bodyColor: "#3c4a42",
        borderColor: "#bbcabf",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#3c4a42", font: { size: 12 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(187, 202, 191, 0.45)" },
        ticks: { color: "#3c4a42", font: { size: 12 } },
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
        backgroundColor: "#ffffff",
        titleColor: "#131b2e",
        bodyColor: "#3c4a42",
        borderColor: "#bbcabf",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(187, 202, 191, 0.35)" },
        ticks: { color: "#3c4a42", font: { size: 12 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(187, 202, 191, 0.45)" },
        ticks: { color: "#3c4a42", font: { size: 12 } },
        border: { display: false },
      },
    },
  };

  const totalAdmins = analytics?.role_distribution?.admins || 0;
  const totalNormalUsers = analytics?.role_distribution?.users || 0;
  const suspendedUsers = users.filter((user) => user.status === "suspended").length;
  const totalUsers = analytics?.stats?.users || 0;
  const topCategory = Object.entries(analytics?.categories || {})
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || "N/A";

  const renderContent = () => {
    if (loading) {
      return (
        <div className="admin-content-loader">
          <div className="admin-loader-card">
            <div className="admin-loader-rings">
              <span></span><span></span><span></span>
              <strong>🌱</strong>
            </div>
            <h2>Loading admin analytics...</h2>
            <p>The sidebar is ready while the analytics content loads.</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="admin-error-card">
          <h2>Could not load analytics</h2>
          <p>{error}</p>
          <button className="admin-refresh-btn" onClick={loadAll}><FaSyncAlt /> Try Again</button>
        </div>
      );
    }

    return (
      <>
        <div className="admin-analytics-hero">
          <div>
            <span className="admin-kicker">System Control Center</span>
            <h1>Admin Analytics</h1>
            <p>Monitor platform growth, user activity, marketplace performance, and seller health.</p>
          </div>
          <div className="admin-hero-actions">
            <button className="admin-light-btn">Last 30 Days</button>
            <button className="admin-refresh-btn" onClick={loadAll}><FaSyncAlt /> Refresh Data</button>
          </div>
        </div>

        <div className="admin-stats admin-stats-wide">
          <div className="admin-stat-card">
            <div className="admin-stat-icon blue"><FaUsers /></div>
            <div>
              <h4>Total Users</h4>
              <p>{formatNumber(totalUsers)}</p>
              <small>{suspendedUsers} suspended</small>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon green"><FaChartLine /></div>
            <div>
              <h4>Total Activities</h4>
              <p>{formatNumber(analytics?.stats?.activities || 0)}</p>
              <small>Tracked carbon actions</small>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon leaf"><FaLeaf /></div>
            <div>
              <h4>Total Carbon</h4>
              <p>{Number(analytics?.stats?.carbon || 0).toFixed(2)} kg</p>
              <small>{topCategory} leads activity</small>
            </div>
          </div>
          <div className="admin-stat-card marketplace">
            <div className="admin-stat-icon store"><FaStore /></div>
            <div>
              <h4>Active Stores</h4>
              <p>{formatNumber(storeAnalytics.active || 0)}</p>
              <small>{formatNumber(storeAnalytics.total || 0)} total stores</small>
            </div>
          </div>
          <div className="admin-stat-card marketplace">
            <div className="admin-stat-icon product"><FaBoxOpen /></div>
            <div>
              <h4>Products</h4>
              <p>{formatNumber(productAnalytics.total || 0)}</p>
              <small>{formatNumber(productAnalytics.hidden || 0)} hidden</small>
            </div>
          </div>
          <div className="admin-stat-card marketplace">
            <div className="admin-stat-icon order"><FaShoppingBag /></div>
            <div>
              <h4>Marketplace Sales</h4>
              <p>{formatMoney(marketplace.total_sales || 0)}</p>
              <small>{formatNumber(marketplace.orders || 0)} orders</small>
            </div>
          </div>
        </div>

        <section className="admin-store-analysis-grid">
          <article className="admin-store-analysis-card featured">
            <div className="admin-card-head">
              <div>
                <h3>Store Section Analysis</h3>
                <span>Seller visibility, store health, and marketplace impact.</span>
              </div>
              <FaShieldAlt />
            </div>
            <div className="store-status-bars">
              <div>
                <div className="store-status-row"><span>Active Stores</span><strong>{storeAnalytics.active || 0}</strong></div>
                <div className="store-status-track"><i style={{ width: `${storeAnalytics.total ? Math.min(100, ((storeAnalytics.active || 0) / storeAnalytics.total) * 100) : 0}%` }} /></div>
              </div>
              <div>
                <div className="store-status-row"><span>Inactive Stores</span><strong>{storeAnalytics.inactive || 0}</strong></div>
                <div className="store-status-track muted"><i style={{ width: `${storeAnalytics.total ? Math.min(100, ((storeAnalytics.inactive || 0) / storeAnalytics.total) * 100) : 0}%` }} /></div>
              </div>
              <div>
                <div className="store-status-row"><span>Suspended Stores</span><strong>{storeAnalytics.suspended || 0}</strong></div>
                <div className="store-status-track danger"><i style={{ width: `${storeAnalytics.total ? Math.min(100, ((storeAnalytics.suspended || 0) / storeAnalytics.total) * 100) : 0}%` }} /></div>
              </div>
            </div>
          </article>

          <article className="admin-store-analysis-card">
            <div className="admin-card-head">
              <div>
                <h3>Top Stores</h3>
                <span>Ranked by revenue and eco performance.</span>
              </div>
            </div>
            <div className="top-store-list">
              {topStores.length ? topStores.slice(0, 5).map((store) => (
                <div className="top-store-row" key={store.id}>
                  <div className="store-avatar">{(store.name || "S").slice(0, 2).toUpperCase()}</div>
                  <div>
                    <strong>{store.name}</strong>
                    <span>{store.products_count || 0} products • {store.owner?.name || "Seller"}</span>
                  </div>
                  <div className="top-store-metric">
                    <strong>{formatMoney(store.revenue || 0)}</strong>
                    <span>{Math.round(Number(store.avg_eco_score || 0))}/100</span>
                  </div>
                </div>
              )) : (
                <p className="empty-copy">No store analytics yet.</p>
              )}
            </div>
          </article>

          <article className="admin-store-analysis-card">
            <div className="admin-card-head">
              <div>
                <h3>Top Carbon-Saving Products</h3>
                <span>Best product impact across active marketplace data.</span>
              </div>
            </div>
            <div className="top-product-impact-list">
              {topProducts.length ? topProducts.slice(0, 5).map((product) => (
                <div className="top-product-impact-row" key={product.id}>
                  <img src={getProductImage(product)} alt={product.name || "Marketplace product"} onError={handleProductImageError} />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.store?.name || "Marketplace Store"}</span>
                  </div>
                  <em>{Number(product.carbon_saving_value || 0).toFixed(1)}kg</em>
                </div>
              )) : (
                <p className="empty-copy">No product impact data yet.</p>
              )}
            </div>
          </article>
        </section>

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
              <div className="summary-item"><strong>Admins</strong><span>{totalAdmins}</span></div>
              <div className="summary-item"><strong>Users</strong><span>{totalNormalUsers}</span></div>
              <div className="summary-item"><strong>Suspended Users</strong><span>{suspendedUsers}</span></div>
              <div className="summary-item"><strong>Most Used Category</strong><span>{topCategory}</span></div>
              <div className="summary-item"><strong>Platform Status</strong><span>● Healthy</span></div>
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
            {analytics?.recent_activities?.length ? analytics.recent_activities.map((item, index) => (
              <div key={index} className="recent-item">
                <strong>{item.user}</strong>
                <span>added</span>
                <span>{item.category}</span>
                <em>{item.carbon} kg</em>
              </div>
            )) : <p className="empty-copy">No recent activity found.</p>}
          </div>
        </div>

        <div className="admin-users-card">
          <div className="admin-card-head">
            <div>
              <h3>User Management</h3>
              <span>Edit users, roles, and suspend accounts when needed.</span>
            </div>
            {tableLoading && <span className="saving-pill">Saving...</span>}
          </div>

          <div className="table-toolbar">
            <div className="search-box">
              <FaSearch />
              <input type="text" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <RoleDropdown value={roleFilter} onChange={setRoleFilter} />
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isEditing = editingId === user.id;
                  const isSuspended = user.status === "suspended";
                  return (
                    <tr key={user.id} className={isSuspended ? "user-suspended-row" : ""}>
                      <td>{user.id}</td>
                      <td>
                        {isEditing ? (
                          <input className="admin-input" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                        ) : <strong>{user.name}</strong>}
                      </td>
                      <td>
                        {isEditing ? (
                          <input className="admin-input" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
                        ) : user.email}
                      </td>
                      <td>
                        {isEditing ? (
                          <select className="admin-select" value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}>
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : <span className={`role-badge ${user.role === "admin" ? "admin" : "user"}`}>{user.role}</span>}
                      </td>
                      <td>
                        {isEditing ? (
                          <select className="admin-select compact" value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}>
                            <option value="active">active</option>
                            <option value="suspended">suspended</option>
                          </select>
                        ) : <span className={`status-badge ${isSuspended ? "suspended" : "active"}`}>{isSuspended ? "Suspended" : "Active"}</span>}
                      </td>
                      <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</td>
                      <td>
                        <div className="admin-actions">
                          {isEditing ? (
                            <>
                              <button className="icon-btn save" onClick={() => saveUser(user.id)} title="Save"><FaSave /></button>
                              <button className="icon-btn cancel" onClick={cancelEdit} title="Cancel"><FaTimes /></button>
                            </>
                          ) : (
                            <>
                              <button className="icon-btn edit" onClick={() => startEdit(user)} title="Edit"><FaEdit /></button>
                              {isSuspended ? (
                                <button className="icon-btn activate" onClick={() => setUserStatus(user, "active")} title="Activate user"><FaUserCheck /></button>
                              ) : (
                                <button className="icon-btn suspend" onClick={() => setUserStatus(user, "suspended")} title="Suspend user"><FaBan /></button>
                              )}
                              <button className="icon-btn delete" onClick={() => deleteUser(user.id)} title="Delete"><FaTrash /></button>
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
      </>
    );
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        <DashboardBackButton />
        <div className="admin-container">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
