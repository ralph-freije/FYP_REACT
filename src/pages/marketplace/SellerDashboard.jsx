import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBoxOpen,
  FaChartLine,
  FaClipboardList,
  FaCoins,
  FaLeaf,
  FaSearch,
  FaSeedling,
  FaShoppingBag,
  FaStore,
  FaTruck,
} from "react-icons/fa";
import { FiAlertTriangle, FiArrowRight, FiPackage, FiPlus, FiRefreshCcw } from "react-icons/fi";
import { getSellerDashboard } from "../../api/marketplaceApi";
import {
  MarketplaceDashboardShell,
  MarketplaceImage,
  StateBlock,
  formatCurrency,
  getErrorMessage,
} from "./MarketplaceShared";

const numberFormat = new Intl.NumberFormat("en-US");

const formatCompact = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: Number(value || 0) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const statusLabel = (item) => {
  const status = item.order_status || item.payment_status || "new";
  if (status === "paid") return "Paid";
  if (status === "processing") return "Processing";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "New";
};

const statusClass = (label) => {
  const key = label.toLowerCase();
  if (key.includes("completed")) return "is-completed";
  if (key.includes("processing")) return "is-processing";
  if (key.includes("cancelled")) return "is-cancelled";
  return "is-new";
};

function SellerStatCard({ className = "", icon, label, value, note, accent = "" }) {
  return (
    <article className={`seller-kpi-card ${accent} ${className}`}>
      <div className="seller-kpi-top">
        <span className="seller-kpi-icon">{icon}</span>
        {note && <small>{note}</small>}
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function SellerProductThumb({ item, size = "sm" }) {
  return (
    <div className={`seller-product-thumb ${size}`}>
      <MarketplaceImage product={item} alt={item?.product_name || item?.name || "Product"} seed={`seller-${item?.id || item?.slug || "product"}`} />
    </div>
  );
}

export default function SellerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getSellerDashboard();
        setDashboard(response.data);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load seller dashboard."));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    const orders = dashboard?.recent_orders || [];
    if (!term) return orders;

    return orders.filter((item) => {
      return [item.product_name, item.order_number, item.customer_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [dashboard?.recent_orders, search]);

  const weeklySales = dashboard?.weekly_sales || [];
  const maxWeeklyValue = Math.max(...weeklySales.map((item) => Number(item.value || 0)), 1);
  const stats = dashboard?.stats || {};
  const lowStockProducts = dashboard?.low_stock_products || [];
  const topProducts = dashboard?.top_products || [];

  return (
    <MarketplaceDashboardShell
      title="Seller Insights"
      subtitle={dashboard?.store?.name ? `${dashboard.store.name} marketplace performance` : "Manage your eco store performance."}
      actions={
        <>
          <label className="seller-dashboard-search">
            <FaSearch />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search orders..."
              type="search"
            />
          </label>
          <Link to="/seller/products" className="mp-btn seller-add-product-btn">
            <FiPlus /> Add Product
          </Link>
        </>
      }
    >
      {loading ? (
        <StateBlock title="Loading seller dashboard..." icon={<FaStore />}>
          Gathering store products, orders, revenue, and sustainability impact.
        </StateBlock>
      ) : error ? (
        <StateBlock
          title="Seller dashboard unavailable"
          tone="error"
          action={<Link to="/seller/apply" className="mp-btn-light">Check application</Link>}
        >
          {error}
        </StateBlock>
      ) : !dashboard ? (
        <StateBlock title="No seller data" icon={<FaStore />}>
          Your seller dashboard will appear after your store is active.
        </StateBlock>
      ) : (
        <div className="seller-dashboard-redesign">
          <section className="seller-store-banner">
            <div>
              <span className="seller-store-kicker"><FaLeaf /> Active seller workspace</span>
              <h2>{dashboard.store?.name || "Your Eco Store"}</h2>
              <p>{dashboard.store?.description || "Track orders, revenue, product health, and the impact your store creates for EcoTrack shoppers."}</p>
            </div>
            <div className="seller-store-status">
              <span>{dashboard.store?.status || "active"}</span>
              <Link to={`/stores/${dashboard.store?.slug}`} className="seller-store-link">
                View storefront <FiArrowRight />
              </Link>
            </div>
          </section>

          <section className="seller-kpi-grid">
            <SellerStatCard
              className="wide"
              icon={<FaCoins />}
              label="Total Sales"
              value={formatCurrency(stats.revenue)}
              note="Revenue from paid orders"
              accent="blue"
            />
            <SellerStatCard
              className="wide eco"
              icon={<FaLeaf />}
              label="CO₂ Savings Sold"
              value={`${formatCompact(stats.co2_savings_sold)} kg`}
              note="High impact"
            />
            <SellerStatCard
              icon={<FiPackage />}
              label="Total Products"
              value={numberFormat.format(stats.products || 0)}
              note="Catalog"
            />
            <SellerStatCard
              icon={<FaBoxOpen />}
              label="Active Live"
              value={numberFormat.format(stats.active_products || 0)}
              note="Visible"
            />
            <article className="seller-alert-card danger">
              <span><FiAlertTriangle /></span>
              <div>
                <p>Low Stock Alerts</p>
                <strong>{numberFormat.format(stats.low_stock || 0)} Items Need Attention</strong>
              </div>
              <Link to="/seller/products">Restock</Link>
            </article>
            <article className="seller-alert-card">
              <span><FaTruck /></span>
              <div>
                <p>Pending Orders</p>
                <strong>{numberFormat.format(stats.pending_orders || 0)} Orders</strong>
              </div>
              <Link to="/seller/orders">Ship Batch</Link>
            </article>
          </section>

          <section className="seller-dashboard-main-grid">
            <article className="seller-performance-card">
              <div className="seller-section-heading">
                <div>
                  <h3>Sales Performance</h3>
                  <p>Sustainability metrics and revenue flow.</p>
                </div>
                <div className="seller-period-toggle">
                  <button type="button">Weekly</button>
                  <span>Monthly</span>
                </div>
              </div>
              <div className="seller-chart-area">
                <div className="seller-chart-lines" aria-hidden="true">
                  <span>$20k</span>
                  <span>$15k</span>
                  <span>$10k</span>
                  <span>$5k</span>
                </div>
                <div className="seller-chart-bars">
                  {weeklySales.map((item, index) => {
                    const height = Math.max(10, Math.round((Number(item.value || 0) / maxWeeklyValue) * 88));
                    const isPeak = Number(item.value || 0) === maxWeeklyValue && maxWeeklyValue > 0;
                    return (
                      <div className="seller-chart-day" key={`${item.label}-${index}`}>
                        <div className={`seller-chart-bar ${isPeak ? "peak" : ""}`} style={{ height: `${height}%` }} title={`${item.label}: ${formatCurrency(item.value)}`} />
                        <span>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>

            <article className="seller-recent-card">
              <div className="seller-section-heading compact">
                <h3>Recent Orders</h3>
                <Link to="/seller/orders">View All</Link>
              </div>
              <div className="seller-recent-list">
                {filteredOrders.length > 0 ? filteredOrders.map((item) => {
                  const label = statusLabel(item);
                  return (
                    <Link to="/seller/orders" className="seller-recent-item" key={item.id}>
                      <SellerProductThumb item={item} />
                      <div>
                        <strong>{item.product_name}</strong>
                        <small>{item.order_number || `Order #${item.order_id}`} • {item.created_at || "recent"}</small>
                      </div>
                      <div className="seller-recent-price">
                        <b>{formatCurrency(item.line_total)}</b>
                        <span className={statusClass(label)}>{label}</span>
                      </div>
                    </Link>
                  );
                }) : (
                  <div className="seller-empty-mini"><FaClipboardList /> No matching recent orders.</div>
                )}
              </div>
            </article>
          </section>

          <section className="seller-dashboard-bottom-grid">
            <article className="seller-low-stock-card">
              <div className="seller-section-heading compact">
                <h3>Low Stock Alerts</h3>
                <Link to="/seller/products">Manage</Link>
              </div>
              {lowStockProducts.length > 0 ? (
                <div className="seller-low-stock-table">
                  <div className="seller-low-stock-head">
                    <span>Product Name</span>
                    <span>Stock Level</span>
                    <span>Status</span>
                    <span>Action</span>
                  </div>
                  {lowStockProducts.map((product) => {
                    const stock = Number(product.stock || 0);
                    const percentage = Math.min(100, Math.max(4, stock * 10));
                    return (
                      <div className="seller-low-stock-row" key={product.id}>
                        <div className="seller-low-product">
                          <SellerProductThumb item={product} size="xs" />
                          <span>{product.name}</span>
                        </div>
                        <div className="seller-stock-progress">
                          <span><i style={{ width: `${percentage}%` }} /></span>
                          <b>{stock}/100</b>
                        </div>
                        <strong className={product.status === "critical" ? "critical" : "warning"}>{product.status}</strong>
                        <Link to="/seller/products">Restock</Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="seller-empty-mini"><FiRefreshCcw /> No products are low on stock.</div>
              )}
            </article>

            <article className="seller-impact-card">
              <div className="seller-impact-content">
                <span><FaSeedling /> AI Insight</span>
                <h3>Your Eco-Score is Rising</h3>
                <p>
                  Your catalog has helped shoppers save <strong>{formatCompact(stats.co2_savings_sold)} kg CO₂</strong> through sustainable alternatives.
                </p>
                <Link to="/seller/products">Optimize Strategy</Link>
              </div>
            </article>
          </section>

          {topProducts.length > 0 && (
            <section className="seller-top-products-card">
              <div className="seller-section-heading compact">
                <h3>Top Products</h3>
                <span><FaChartLine /> by revenue</span>
              </div>
              <div className="seller-top-products-grid">
                {topProducts.map((product) => (
                  <article className="seller-top-product" key={product.id || product.slug}>
                    <SellerProductThumb item={{ ...product, product_name: product.name }} size="md" />
                    <div>
                      <h4>{product.name}</h4>
                      <p>{numberFormat.format(product.quantity_sold || 0)} sold</p>
                    </div>
                    <strong>{formatCurrency(product.revenue)}</strong>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </MarketplaceDashboardShell>
  );
}
