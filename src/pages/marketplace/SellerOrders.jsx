import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaClipboardList,
  FaComments,
  FaFilter,
  FaLeaf,
  FaMapMarkerAlt,
  FaRegClock,
  FaSave,
  FaSearch,
  FaShippingFast,
  FaTimes,
  FaTruck,
} from "react-icons/fa";
import {
  getSellerOrders,
  messageSellerOrderBuyer,
  updateSellerOrderStatus,
} from "../../api/marketplaceApi";
import {
  MarketplaceDashboardShell,
  MarketplaceImage,
  StateBlock,
  formatCurrency,
  getErrorMessage,
} from "./MarketplaceShared";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const SELLER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_META = {
  pending: {
    label: "Pending",
    className: "pending",
    icon: <FaRegClock />,
    helper: "Waiting for confirmation",
  },
  paid: {
    label: "Processing",
    className: "processing",
    icon: <FaBoxOpen />,
    helper: "Payment received",
  },
  processing: {
    label: "Processing",
    className: "processing",
    icon: <FaBoxOpen />,
    helper: "Prepare this order",
  },
  shipped: {
    label: "Shipped",
    className: "shipped",
    icon: <FaShippingFast />,
    helper: "On the way",
  },
  completed: {
    label: "Delivered",
    className: "delivered",
    icon: <FaCheckCircle />,
    helper: "Order completed",
  },
  delivered: {
    label: "Delivered",
    className: "delivered",
    icon: <FaCheckCircle />,
    helper: "Order completed",
  },
  cancelled: {
    label: "Cancelled",
    className: "cancelled",
    icon: <FaTimes />,
    helper: "Order cancelled",
  },
};

const getItemStatus = (item) => {
  const rawStatus = String(item.order_status || item.status || "processing").toLowerCase();
  const status = STATUS_META[rawStatus] ? rawStatus : "processing";
  const meta = STATUS_META[status];
  const filterKey = status === "paid" ? "processing" : status === "completed" ? "delivered" : status;

  return { ...meta, rawStatus: status, filterKey };
};

const getEditableStatusValue = (item) => {
  const status = getItemStatus(item).rawStatus;
  if (status === "paid") return "processing";
  if (status === "completed") return "delivered";
  return SELLER_STATUS_OPTIONS.some((option) => option.value === status) ? status : "processing";
};

const formatDate = (value, fallback = "Recently") => {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value, fallback = "Not available") => {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getInitials = (name = "Customer") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CU";

const getShippingLine = (item) => {
  const parts = [item.shipping_address, item.shipping_city, item.shipping_region]
    .filter(Boolean)
    .map((part) => String(part).trim());

  return parts.length ? parts.join(", ") : "Shipping address not provided";
};

const getOrderNumber = (item) => item.order_number || item.order?.order_number || `Order #${item.order_id || item.id}`;

export default function SellerOrders() {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [messageItemId, setMessageItemId] = useState(null);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getSellerOrders();
        setOrderItems(response.data.order_items || []);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load seller orders."));
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return orderItems.filter((item) => {
      const status = getItemStatus(item);
      const matchesFilter = activeFilter === "all" || status.filterKey === activeFilter;
      const haystack = [
        getOrderNumber(item),
        item.customer_name,
        item.customer_email,
        item.product_name,
        item.shipping_address,
        item.shipping_city,
        item.shipping_region,
        item.order_status,
        item.payment_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!query || haystack.includes(query));
    });
  }, [activeFilter, orderItems, searchTerm]);

  const stats = useMemo(() => {
    const totalRevenue = orderItems.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
    const activeItems = orderItems.filter((item) => !["cancelled", "completed", "delivered"].includes(getItemStatus(item).filterKey));
    const readyToShip = orderItems.filter((item) => ["paid", "processing"].includes(getItemStatus(item).rawStatus)).length;
    const ecoSaved = orderItems.reduce((sum, item) => sum + Number(item.carbon_saving_total || 0), 0);

    return {
      totalOrders: orderItems.length,
      activeOrders: activeItems.length,
      readyToShip,
      totalRevenue,
      ecoSaved,
    };
  }, [orderItems]);

  const closeDrawer = () => setSelectedItem(null);

  const handleStatusChange = async (item, nextStatus) => {
    if (!item?.id || !nextStatus) return;

    try {
      setFlash(null);
      setUpdatingItemId(item.id);
      const response = await updateSellerOrderStatus(item.id, nextStatus);
      const updatedItem = response.data.order_item;

      setOrderItems((currentItems) => currentItems.map((currentItem) => {
        if (updatedItem && Number(currentItem.id) === Number(updatedItem.id)) {
          return { ...currentItem, ...updatedItem };
        }

        if (updatedItem && Number(currentItem.order_id) === Number(updatedItem.order_id)) {
          return {
            ...currentItem,
            order_status: updatedItem.order_status,
          };
        }

        return currentItem;
      }));

      setSelectedItem((currentItem) => {
        if (!currentItem || !updatedItem) return currentItem;
        if (Number(currentItem.id) === Number(updatedItem.id)) return { ...currentItem, ...updatedItem };
        if (Number(currentItem.order_id) === Number(updatedItem.order_id)) {
          return { ...currentItem, order_status: updatedItem.order_status };
        }
        return currentItem;
      });

      setFlash({ type: "success", text: response.data.message || "Order status updated." });
    } catch (err) {
      setFlash({ type: "error", text: getErrorMessage(err, "Could not update order status.") });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleMessageBuyer = async (item) => {
    if (!item?.id) return;

    try {
      setFlash(null);
      setMessageItemId(item.id);
      const response = await messageSellerOrderBuyer(item.id);
      const conversationId = response.data.conversation_id;
      const draft = response.data.draft || `Hi, I am contacting you about order ${getOrderNumber(item)} on EcoTrack.`;

      if (conversationId) {
        navigate(`/messages?conversation=${conversationId}&draft=${encodeURIComponent(draft)}`);
        return;
      }

      navigate("/messages");
    } catch (err) {
      setFlash({ type: "error", text: getErrorMessage(err, "Could not open buyer chat.") });
    } finally {
      setMessageItemId(null);
    }
  };

  return (
    <MarketplaceDashboardShell
      title="Seller Orders"
      subtitle="Manage incoming marketplace orders with a cleaner fulfillment workflow."
      actions={<Link to="/seller/products" className="mp-btn-light">Products</Link>}
    >
      {loading ? (
        <StateBlock title="Loading seller orders..." icon={<FaClipboardList />}>
          Getting order items for your store.
        </StateBlock>
      ) : error ? (
        <StateBlock title="Seller orders unavailable" tone="error">
          {error}
        </StateBlock>
      ) : orderItems.length === 0 ? (
        <StateBlock title="No seller orders yet" icon={<FaClipboardList />}>
          When customers buy your products, order items will appear here.
        </StateBlock>
      ) : (
        <section className="seller-orders-redesign">
          <div className="seller-orders-hero">
            <div>
              <span className="seller-orders-kicker"><FaTruck /> Fulfillment Center</span>
              <h2>Track every product sold from your store.</h2>
              <p>
                Search orders, review customer details, message buyers, and update fulfillment status without leaving your dashboard.
              </p>
            </div>
            <div className="seller-orders-hero-card">
              <span>Today&apos;s focus</span>
              <strong>{stats.readyToShip}</strong>
              <small>orders ready to prepare</small>
            </div>
          </div>

          <div className="seller-orders-stats">
            <article>
              <span>Total items</span>
              <strong>{stats.totalOrders}</strong>
              <small>All seller order lines</small>
            </article>
            <article>
              <span>Active orders</span>
              <strong>{stats.activeOrders}</strong>
              <small>Pending or processing</small>
            </article>
            <article>
              <span>Revenue</span>
              <strong>{formatCurrency(stats.totalRevenue)}</strong>
              <small>From listed items</small>
            </article>
            <article>
              <span>Carbon saved</span>
              <strong>{stats.ecoSaved.toFixed(2)} kg</strong>
              <small>Estimated AI impact</small>
            </article>
          </div>

          <div className="seller-orders-toolbar">
            <div className="seller-orders-tabs" aria-label="Order status filters">
              {STATUS_FILTERS.map((filter) => (
                <button
                  type="button"
                  key={filter.key}
                  className={activeFilter === filter.key ? "active" : ""}
                  onClick={() => setActiveFilter(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="seller-orders-search-row">
              <label className="seller-orders-search">
                <FaSearch />
                <input
                  type="search"
                  placeholder="Search orders, customers, products..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
              <button type="button" className="seller-orders-filter-btn" aria-label="Filter orders">
                <FaFilter />
              </button>
            </div>
          </div>

          {flash && (
            <div className={`seller-orders-alert ${flash.type}`}>
              {flash.text}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <StateBlock title="No orders match this view" icon={<FaSearch />}>
              Try another status tab or search term.
            </StateBlock>
          ) : (
            <div className="seller-orders-list">
              {filteredItems.map((item) => {
                const status = getItemStatus(item);
                const shippingLine = getShippingLine(item);

                return (
                  <button
                    type="button"
                    className={`seller-order-card ${status.className}`}
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="seller-order-thumb">
                      <MarketplaceImage
                        product={item}
                        alt={item.product_name}
                        seed={`seller-order-${item.id}`}
                      />
                    </div>

                    <div className="seller-order-main">
                      <span className="seller-order-number">#{getOrderNumber(item)}</span>
                      <h3>{item.product_name}</h3>
                      <p>{status.helper}</p>
                    </div>

                    <div className="seller-order-info">
                      <span>Customer</span>
                      <strong>{item.customer_name || "Customer"}</strong>
                    </div>

                    <div className="seller-order-info">
                      <span>Total</span>
                      <strong>{formatCurrency(item.line_total)}</strong>
                      <small>x{item.quantity}</small>
                    </div>

                    <div className="seller-order-info seller-order-date">
                      <span>Date</span>
                      <strong>{formatDate(item.created_at_iso || item.created_at)}</strong>
                    </div>

                    <div className="seller-order-address">
                      <span>Shipping to</span>
                      <strong>{shippingLine}</strong>
                    </div>

                    <div className="seller-order-status-wrap">
                      <span className={`seller-order-status ${status.className}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedItem && (
            <SellerOrderDrawer
              item={selectedItem}
              onClose={closeDrawer}
              onMessageBuyer={handleMessageBuyer}
              onStatusChange={handleStatusChange}
              messaging={Number(messageItemId) === Number(selectedItem.id)}
              updatingStatus={Number(updatingItemId) === Number(selectedItem.id)}
            />
          )}
        </section>
      )}
    </MarketplaceDashboardShell>
  );
}

function SellerOrderDrawer({ item, onClose, onMessageBuyer, onStatusChange, messaging, updatingStatus }) {
  const status = getItemStatus(item);
  const orderNumber = getOrderNumber(item);
  const shippingLine = getShippingLine(item);
  const orderedAt = item.created_at_iso || item.created_at;
  const confirmedAt = item.paid_at || orderedAt;
  const carbonSaving = Number(item.carbon_saving_total || 0);
  const productUrl = item.product_slug ? `/marketplace/products/${item.product_slug}` : "/seller/products";
  const currentEditableStatus = getEditableStatusValue(item);
  const [nextStatus, setNextStatus] = useState(currentEditableStatus);

  useEffect(() => {
    setNextStatus(currentEditableStatus);
  }, [currentEditableStatus, item.id]);

  const statusChanged = nextStatus !== currentEditableStatus;

  return (
    <>
      <button type="button" className="seller-order-drawer-overlay" aria-label="Close order details" onClick={onClose} />
      <aside className="seller-order-drawer" aria-label="Order details">
        <header>
          <button type="button" className="seller-order-drawer-close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
          <div>
            <h2>Order Details</h2>
            <span className={`seller-order-status ${status.className}`}>{status.icon} {status.label}</span>
          </div>
        </header>

        <div className="seller-order-drawer-body">
          <section className="seller-order-drawer-section buyer">
            <h3>Buyer Information</h3>
            <div className="seller-order-buyer-card">
              <div className="seller-order-avatar">{getInitials(item.customer_name)}</div>
              <div>
                <strong>{item.customer_name || "Customer"}</strong>
                <span>{item.customer_email || "Email not provided"}</span>
                <span>{item.customer_phone || "Phone not provided"}</span>
              </div>
            </div>
          </section>

          <section className="seller-order-drawer-section seller-order-status-editor">
            <h3>Update Order Status</h3>
            <div className="seller-order-status-panel">
              <label>
                <span>Fulfillment status</span>
                <select
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value)}
                  disabled={updatingStatus}
                >
                  {SELLER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="mp-btn seller-order-save-status"
                disabled={updatingStatus || !statusChanged}
                onClick={() => onStatusChange(item, nextStatus)}
              >
                <FaSave /> {updatingStatus ? "Saving..." : "Save Status"}
              </button>
              <p>Use this to move an order from pending to processing, shipped, delivered, or cancelled.</p>
            </div>
          </section>

          <section className="seller-order-drawer-section">
            <h3>Shipping Address</h3>
            <div className="seller-order-soft-card icon-card">
              <FaMapMarkerAlt />
              <p>{shippingLine}</p>
            </div>
          </section>

          <section className="seller-order-drawer-section">
            <h3>Order Notes</h3>
            <div className="seller-order-soft-card notes-card">
              {item.notes || "No customer notes for this order."}
            </div>
          </section>

          <section className="seller-order-drawer-section">
            <div className="seller-order-section-title-row">
              <h3>Product</h3>
              <span>{item.quantity} item{Number(item.quantity) === 1 ? "" : "s"}</span>
            </div>
            <div className="seller-order-product-card">
              <div className="seller-order-product-image">
                <MarketplaceImage
                  product={item}
                  alt={item.product_name}
                  seed={`seller-order-drawer-${item.id}`}
                />
              </div>
              <div>
                <strong>{item.product_name}</strong>
                <span>{formatCurrency(item.unit_price || Number(item.line_total || 0) / Math.max(Number(item.quantity || 1), 1))} × {item.quantity}</span>
              </div>
              <b>{formatCurrency(item.line_total)}</b>
            </div>

            <div className="seller-order-impact-box">
              <div>
                <FaLeaf />
                <span>Eco-impact of this order</span>
              </div>
              <div className="seller-order-impact-grid">
                <article>
                  <span>Carbon saved</span>
                  <strong>{carbonSaving.toFixed(2)} kg</strong>
                </article>
                <article>
                  <span>Eco score</span>
                  <strong>{item.eco_score ? `${item.eco_score}/100` : "AI"}</strong>
                </article>
              </div>
            </div>
          </section>

          <section className="seller-order-drawer-section">
            <h3>Fulfillment Timeline</h3>
            <div className="seller-order-timeline">
              <TimelineItem active title="Ordered" description={formatDateTime(orderedAt)} />
              <TimelineItem active={status.rawStatus !== "pending"} title="Payment confirmed" description={formatDateTime(confirmedAt)} />
              <TimelineItem active={["shipped", "completed", "delivered"].includes(status.rawStatus)} title="Shipped" description="Ready when tracking is added" />
              <TimelineItem active={["completed", "delivered"].includes(status.rawStatus)} title="Delivered" description="Final delivery step" />
            </div>
          </section>
        </div>

        <footer>
          <Link to={productUrl} className="mp-btn">View Product</Link>
          <button
            type="button"
            className="mp-btn-light"
            onClick={() => onMessageBuyer(item)}
            disabled={messaging}
          >
            <FaComments /> {messaging ? "Opening Chat..." : "Message Buyer"}
          </button>
        </footer>
      </aside>
    </>
  );
}

function TimelineItem({ active, title, description }) {
  return (
    <div className={`seller-order-timeline-item ${active ? "active" : ""}`}>
      <span />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}
