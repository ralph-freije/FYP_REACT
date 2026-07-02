import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaChevronDown,
  FaClock,
  FaCreditCard,
  FaLeaf,
  FaReceipt,
  FaSearch,
  FaShoppingBag,
  FaSyncAlt,
  FaTimesCircle,
  FaTruck,
} from "react-icons/fa";
import { PublicShell } from "./public/PublicPages";
import { getOrders } from "../api/marketplaceApi";
import "./MarketplaceOrders.css";
import { getProductImage, handleProductImageError } from "../utils/productImages";

const money = (value) => `$${Number(value || 0).toFixed(2)}`;


function formatDate(value) {
  if (!value) return "Recently";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeStatus(order) {
  const paymentStatus = String(order.payment_status || "").toLowerCase();
  const status = String(order.status || "pending").toLowerCase();

  if (paymentStatus === "failed" || status === "cancelled" || status === "canceled") {
    return { key: "cancelled", label: paymentStatus === "failed" ? "Payment Failed" : "Cancelled", icon: <FaTimesCircle /> };
  }
  if (status === "delivered" || status === "completed") {
    return { key: "delivered", label: "Delivered", icon: <FaCheckCircle /> };
  }
  if (status === "shipped") {
    return { key: "shipped", label: "Shipped", icon: <FaTruck /> };
  }
  if (status === "processing" || paymentStatus === "paid") {
    return { key: "processing", label: "Processing", icon: <FaSyncAlt /> };
  }
  return { key: "pending", label: "Pending", icon: <FaClock /> };
}

function getOrderCarbon(order) {
  if (Number.isFinite(Number(order.carbon_saving_total))) {
    return Number(order.carbon_saving_total);
  }

  return (order.items || []).reduce((total, item) => {
    const direct = item.carbon_saving_total;
    const product = item.product || {};
    const value = direct ?? product.carbon_saving_value ?? product.carbon_saving_kg ?? 0;
    return total + Number(value || 0) * (direct ? 1 : Number(item.quantity || 1));
  }, 0);
}

function getOrderImage(order) {
  const firstItem = order.items?.[0];
  return getProductImage(firstItem);
}

function getItemImage(item) {
  return getProductImage(item);
}

function orderTotal(order) {
  return order.total ?? order.total_amount ?? 0;
}

function orderItemCount(order) {
  return (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function tabForOrder(order) {
  const status = normalizeStatus(order).key;
  if (["pending", "processing", "shipped"].includes(status)) return "active";
  if (status === "delivered") return "completed";
  return "cancelled";
}

function OrderDetails({ order }) {
  return (
    <div className="orders-details-panel">
      <div className="orders-detail-head">
        <div>
          <span>Receipt</span>
          <strong>{order.items?.length || 0} product{Number(order.items?.length || 0) === 1 ? "" : "s"}</strong>
        </div>
        <div>
          <span>Payment</span>
          <strong><FaCreditCard /> Card {order.simulated_card_last4 ? `•••• ${order.simulated_card_last4}` : ""}</strong>
        </div>
      </div>

      <div className="orders-receipt-list">
        {(order.items || []).map((item) => (
          <div className="orders-receipt-row" key={item.id}>
            <img
              src={getItemImage(item)}
              alt={item.product_name || item.product?.name || "Marketplace product"}
              onError={handleProductImageError}
            />
            <div>
              <strong>{item.product_name || item.product?.name || "Marketplace product"}</strong>
              <span>
                Qty: {item.quantity} • {Number(item.carbon_saving_total ?? (item.product?.carbon_saving_value || 0) * Number(item.quantity || 1)).toFixed(1)} kg CO₂/month
              </span>
            </div>
            <b>{money(item.line_total)}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderCard({ order, expanded, onToggle }) {
  const status = normalizeStatus(order);
  const carbon = getOrderCarbon(order);
  const receiptUrl = status.key === "cancelled" ? `/orders/${order.id}/failed` : `/orders/${order.id}/success`;

  return (
    <article className="orders-card">
      <div className="orders-card-main">
        <div className="orders-product-shot">
          <img
            src={getOrderImage(order)}
            alt={order.order_number || "Order"}
            onError={handleProductImageError}
          />
        </div>

        <div className="orders-card-copy">
          <div className="orders-card-title-row">
            <h3>{order.order_number || `Order #${order.id}`}</h3>
            <span className={`orders-status ${status.key}`}>{status.icon}{status.label}</span>
          </div>

          <p>Purchased on {formatDate(order.created_at)}</p>

          <div className="orders-card-metrics">
            <div>
              <span>Total</span>
              <strong>{money(orderTotal(order))}</strong>
            </div>
            <div>
              <span>Items</span>
              <strong>{orderItemCount(order)}</strong>
            </div>
            <div>
              <span>Carbon Saved</span>
              <strong className="orders-carbon"><FaLeaf /> {carbon.toFixed(1)} kg CO₂e</strong>
            </div>
          </div>
        </div>

        <div className="orders-card-actions">
          <Link to={receiptUrl} className={status.key === "cancelled" ? "orders-action danger" : "orders-action primary"}>
            {status.key === "cancelled" ? "View Failure" : "View Receipt"}
          </Link>
          <button type="button" className="orders-details-toggle" onClick={onToggle}>
            Order Details <FaChevronDown className={expanded ? "open" : ""} />
          </button>
        </div>
      </div>

      {expanded && <OrderDetails order={order} />}
    </article>
  );
}

function MarketplaceOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");

    getOrders()
      .then((response) => {
        if (active) setOrders(response.data?.orders || []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Could not load your marketplace orders.");
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const tabMatch = activeTab === "all" || tabForOrder(order) === activeTab;
      if (!tabMatch) return false;

      if (!normalizedQuery) return true;

      const productNames = (order.items || [])
        .map((item) => item.product_name || item.product?.name || "")
        .join(" ")
        .toLowerCase();

      return `${order.order_number || ""} ${productNames}`.toLowerCase().includes(normalizedQuery);
    });
  }, [orders, activeTab, query]);

  const counts = useMemo(() => ({
    all: orders.length,
    active: orders.filter((order) => tabForOrder(order) === "active").length,
    completed: orders.filter((order) => tabForOrder(order) === "completed").length,
    cancelled: orders.filter((order) => tabForOrder(order) === "cancelled").length,
  }), [orders]);

  return (
    <PublicShell>
      <section className="orders-page">
        <div className="orders-shell">
          <div className="orders-hero-card">
            <div className="orders-hero-icon"><FaReceipt /></div>
            <div>
              <span className="orders-eyebrow">Marketplace Orders</span>
              <h1>My Orders</h1>
              <p>Track purchases, card payment status, receipts, and the eco impact from your sustainable shopping.</p>
            </div>
            <Link to="/marketplace" className="orders-shop-link"><FaShoppingBag /> Continue Shopping</Link>
          </div>

          <div className="orders-toolbar">
            <div className="orders-tabs" role="tablist" aria-label="Order filters">
              {[
                ["all", "All Orders"],
                ["active", "Active"],
                ["completed", "Completed"],
                ["cancelled", "Cancelled"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={activeTab === key ? "active" : ""}
                  onClick={() => setActiveTab(key)}
                >
                  {label} <span>{counts[key]}</span>
                </button>
              ))}
            </div>

            <label className="orders-search">
              <FaSearch />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search orders..."
              />
            </label>
          </div>

          {loading ? (
            <div className="orders-empty">
              <FaBoxOpen />
              <h2>Loading orders...</h2>
              <p>Getting your marketplace receipt history.</p>
            </div>
          ) : error ? (
            <div className="orders-empty error">
              <FaTimesCircle />
              <h2>Orders unavailable</h2>
              <p>{error}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="orders-empty">
              <FaBoxOpen />
              <h2>{orders.length ? "No matching orders" : "No orders yet"}</h2>
              <p>{orders.length ? "Try another status filter or search term." : "Start shopping to create your first EcoTrack marketplace order."}</p>
              <Link to="/marketplace">Browse Marketplace</Link>
            </div>
          ) : (
            <div className="orders-list">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expandedOrderId === order.id}
                  onToggle={() => setExpandedOrderId((current) => current === order.id ? null : order.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicShell>
  );
}

export default MarketplaceOrders;
