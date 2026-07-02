import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaClipboardList } from "react-icons/fa";
import { getOrders } from "../../api/marketplaceApi";
import {
  MarketplaceDashboardShell,
  StateBlock,
  formatCurrency,
  getErrorMessage,
} from "./MarketplaceShared";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getOrders();
        setOrders(response.data.orders || []);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load orders."));
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  return (
    <MarketplaceDashboardShell
      title="Orders"
      subtitle="Your marketplace purchase history."
      actions={<Link to="/marketplace" className="mp-btn-light">Shop more</Link>}
    >
      {loading ? (
        <StateBlock title="Loading orders..." icon={<FaClipboardList />}>
          Getting your order history.
        </StateBlock>
      ) : error ? (
        <StateBlock title="Orders unavailable" tone="error">
          {error}
        </StateBlock>
      ) : orders.length === 0 ? (
        <StateBlock
          title="No orders yet"
          icon={<FaClipboardList />}
          action={<Link to="/marketplace" className="mp-btn">Browse marketplace</Link>}
        >
          Completed checkouts will appear here.
        </StateBlock>
      ) : (
        <section className="mp-order-list">
          {orders.map((order) => (
            <article className="mp-order-card" key={order.id}>
              <div className="mp-row-between">
                <div>
                  <h3>{order.order_number}</h3>
                  <p className="mp-muted">
                    {new Date(order.created_at).toLocaleDateString()} - {order.status}
                  </p>
                </div>
                <strong>{formatCurrency(order.total)}</strong>
              </div>
              <div className="mp-table-wrap">
                <table className="mp-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </section>
      )}
    </MarketplaceDashboardShell>
  );
}
