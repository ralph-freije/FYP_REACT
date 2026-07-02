import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBolt,
  FaChartLine,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLeaf,
  FaPauseCircle,
  FaSearch,
  FaShieldAlt,
  FaStore,
  FaTimesCircle,
} from "react-icons/fa";
import { getAdminStores, updateAdminStore } from "../../api/marketplaceApi";
import {
  MarketplaceDashboardShell,
  StateBlock,
  getErrorMessage,
} from "./MarketplaceShared";

const statusMeta = {
  active: {
    label: "Active",
    icon: <FaCheckCircle />,
    className: "active",
    helper: "Visible in the marketplace",
  },
  inactive: {
    label: "Inactive",
    icon: <FaPauseCircle />,
    className: "inactive",
    helper: "Closed by seller temporarily",
  },
  suspended: {
    label: "Suspended",
    icon: <FaTimesCircle />,
    className: "suspended",
    helper: "Hidden by admin action",
  },
};

const getInitials = (text = "Store") =>
  text
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "ST";

const safeNumber = (value) => Number(value || 0);

export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadStores = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminStores();
      setStores(response.data.stores || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load stores."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const toggleStatus = async (store) => {
    try {
      setSavingId(store.id);
      setError("");
      await updateAdminStore(store.id, {
        status: store.status === "active" ? "suspended" : "active",
      });
      await loadStores();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update store."));
    } finally {
      setSavingId(null);
    }
  };

  const filteredStores = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return stores.filter((store) => {
      const matchesStatus = statusFilter === "all" || store.status === statusFilter;
      const haystack = [
        store.name,
        store.description,
        store.location,
        store.owner?.name,
        store.owner?.email,
        ...(Array.isArray(store.product_categories) ? store.product_categories : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [stores, query, statusFilter]);

  const stats = useMemo(() => {
    const active = stores.filter((store) => store.status === "active").length;
    const inactive = stores.filter((store) => store.status === "inactive").length;
    const suspended = stores.filter((store) => store.status === "suspended").length;
    const productCount = stores.reduce((sum, store) => sum + safeNumber(store.products_count), 0);
    const avgProducts = stores.length ? (productCount / stores.length).toFixed(1) : "0";

    return { active, inactive, suspended, productCount, avgProducts };
  }, [stores]);

  const topStore = useMemo(() => {
    return [...stores].sort((a, b) => safeNumber(b.products_count) - safeNumber(a.products_count))[0];
  }, [stores]);

  const filters = [
    { value: "all", label: "All", count: stores.length },
    { value: "active", label: "Active", count: stats.active },
    { value: "inactive", label: "Inactive", count: stats.inactive },
    { value: "suspended", label: "Suspended", count: stats.suspended },
  ];

  return (
    <MarketplaceDashboardShell
      title="Store Management"
      subtitle="Monitor store health, seller visibility, and marketplace compliance."
      actions={
        <>
          <Link to="/admin/marketplace-products" className="mp-btn-light">
            Product Management
          </Link>
          <Link to="/admin/seller-applications" className="mp-btn">
            Seller Applications
          </Link>
        </>
      }
    >
      {loading ? (
        <StateBlock title="Loading stores..." icon={<FaStore />}>
          Getting approved seller stores.
        </StateBlock>
      ) : error && stores.length === 0 ? (
        <StateBlock title="Stores unavailable" tone="error">
          {error}
        </StateBlock>
      ) : stores.length === 0 ? (
        <StateBlock title="No stores yet" icon={<FaStore />}>
          Approving a seller application creates a store row.
        </StateBlock>
      ) : (
        <div className="admin-management-page">
          {error && <div className="mp-alert error">{error}</div>}

          <section className="admin-hero-card admin-store-hero-card">
            <div>
              <span className="admin-hero-kicker">
                <FaShieldAlt /> Admin tools
              </span>
              <h2>Store command center</h2>
              <p>
                Review seller storefronts, watch inactive or suspended shops, and keep the
                public marketplace focused on trusted eco merchants.
              </p>
            </div>
            <div className="admin-hero-score-card">
              <span>Visibility health</span>
              <strong>{stores.length ? Math.round((stats.active / stores.length) * 100) : 0}%</strong>
              <small>{stats.active} active of {stores.length} total stores</small>
            </div>
          </section>

          <section className="admin-kpi-grid">
            <article className="admin-kpi-card">
              <div className="admin-kpi-icon"><FaStore /></div>
              <span>Total stores</span>
              <strong>{stores.length}</strong>
              <small>All approved seller storefronts</small>
            </article>
            <article className="admin-kpi-card success">
              <div className="admin-kpi-icon"><FaCheckCircle /></div>
              <span>Active stores</span>
              <strong>{stats.active}</strong>
              <small>Visible to buyers</small>
            </article>
            <article className="admin-kpi-card warning">
              <div className="admin-kpi-icon"><FaPauseCircle /></div>
              <span>Inactive stores</span>
              <strong>{stats.inactive}</strong>
              <small>Closed temporarily by sellers</small>
            </article>
            <article className="admin-kpi-card danger">
              <div className="admin-kpi-icon"><FaTimesCircle /></div>
              <span>Suspended stores</span>
              <strong>{stats.suspended}</strong>
              <small>Hidden by admin action</small>
            </article>
          </section>

          <section className="admin-control-bar">
            <div className="admin-status-tabs" role="tablist" aria-label="Store status filter">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={statusFilter === filter.value ? "active" : ""}
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                  <span>{filter.count}</span>
                </button>
              ))}
            </div>
            <label className="admin-search-box">
              <FaSearch />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search store, seller, location..."
              />
            </label>
          </section>

          <section className="admin-bento-grid">
            <div className="admin-main-panel">
              <div className="admin-section-heading">
                <div>
                  <h3>Store directory</h3>
                  <p>Card view inspired by high-impact store monitoring dashboards.</p>
                </div>
                <span>{filteredStores.length} shown</span>
              </div>

              <div className="admin-store-card-grid">
                {filteredStores.map((store) => {
                  const meta = statusMeta[store.status] || statusMeta.suspended;
                  const categories = Array.isArray(store.product_categories)
                    ? store.product_categories.filter(Boolean).slice(0, 3)
                    : [];

                  return (
                    <article className="admin-store-card" key={store.id}>
                      <div className="admin-store-card-top">
                        <div className="admin-store-logo">
                          {store.logo_url ? (
                            <img src={store.logo_url} alt={`${store.name} logo`} />
                          ) : (
                            <span>{getInitials(store.name)}</span>
                          )}
                        </div>
                        <span className={`admin-status-pill ${meta.className}`}>
                          {meta.icon} {meta.label}
                        </span>
                      </div>

                      <div className="admin-store-card-body">
                        <h4>{store.name}</h4>
                        <p>{store.description || "No store description added yet."}</p>
                      </div>

                      <div className="admin-store-owner-row">
                        <div>
                          <span>Owner</span>
                          <strong>{store.owner?.name || store.owner?.email || "Unknown owner"}</strong>
                          {store.owner?.email && <small>{store.owner.email}</small>}
                        </div>
                        <div>
                          <span>Products</span>
                          <strong>{store.products_count || 0}</strong>
                          <small>{store.location || "No location"}</small>
                        </div>
                      </div>

                      {categories.length > 0 && (
                        <div className="admin-tag-row">
                          {categories.map((category) => (
                            <span key={category}>{category}</span>
                          ))}
                        </div>
                      )}

                      <div className="admin-store-card-actions">
                        <Link to={`/stores/${store.slug}`} className="mp-btn-light">
                          View Store
                        </Link>
                        <button
                          type="button"
                          className={store.status === "active" ? "mp-btn-danger" : "mp-btn"}
                          disabled={savingId === store.id}
                          onClick={() => toggleStatus(store)}
                        >
                          {savingId === store.id
                            ? "Saving..."
                            : store.status === "active"
                              ? "Suspend"
                              : "Activate"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <aside className="admin-side-stack">
              <article className="admin-insight-card">
                <div className="admin-insight-icon"><FaBolt /></div>
                <h3>Marketplace intelligence</h3>
                <p>
                  {topStore
                    ? `${topStore.name} currently has the largest catalog with ${topStore.products_count || 0} products.`
                    : "Store activity will appear here once sellers publish products."}
                </p>
                <div className="admin-insight-meter">
                  <span>Average products per store</span>
                  <strong>{stats.avgProducts}</strong>
                </div>
              </article>

              <article className="admin-activity-card">
                <div className="admin-section-heading compact">
                  <h3>Review signals</h3>
                  <FaChartLine />
                </div>
                <div className="admin-alert-row">
                  <span className="success"><FaLeaf /></span>
                  <div>
                    <strong>{stats.productCount} total products</strong>
                    <p>Across all seller stores.</p>
                  </div>
                </div>
                <div className="admin-alert-row">
                  <span className="warning"><FaExclamationTriangle /></span>
                  <div>
                    <strong>{stats.inactive + stats.suspended} hidden stores</strong>
                    <p>Inactive or suspended stores are not public.</p>
                  </div>
                </div>
              </article>
            </aside>
          </section>
        </div>
      )}
    </MarketplaceDashboardShell>
  );
}
