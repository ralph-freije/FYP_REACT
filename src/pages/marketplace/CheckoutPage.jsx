import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaCreditCard } from "react-icons/fa";
import { checkoutCart, getCart } from "../../api/marketplaceApi";
import {
  MarketplaceDashboardShell,
  StateBlock,
  formatCurrency,
  getErrorMessage,
} from "./MarketplaceShared";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], subtotal: 0, count: 0 });
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    shipping_address: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    setForm((prev) => ({
      ...prev,
      customer_name: user.name || "",
      customer_email: user.email || "",
    }));

    const loadCart = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getCart();
        setCart(response.data);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load checkout."));
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      await checkoutCart(form);
      window.dispatchEvent(new Event("marketplace-cart-updated"));
      navigate("/orders");
    } catch (err) {
      setError(getErrorMessage(err, "Checkout failed."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <MarketplaceDashboardShell
      title="Checkout"
      subtitle="Create your marketplace order."
      actions={<Link to="/cart" className="mp-btn-light">Back to cart</Link>}
    >
      {loading ? (
        <StateBlock title="Preparing checkout..." icon={<FaCreditCard />}>
          Checking cart totals and stock.
        </StateBlock>
      ) : error && cart.items.length === 0 ? (
        <StateBlock title="Checkout unavailable" tone="error">
          {error}
        </StateBlock>
      ) : cart.items.length === 0 ? (
        <StateBlock
          title="No items to checkout"
          icon={<FaCreditCard />}
          action={<Link to="/marketplace" className="mp-btn">Browse marketplace</Link>}
        >
          Add products to your cart before placing an order.
        </StateBlock>
      ) : (
        <div className="mp-form-card">
          {error && <div className="mp-alert error">{error}</div>}
          <form onSubmit={handleSubmit} className="mp-form-grid">
            <input
              className="mp-input"
              type="text"
              placeholder="Full name"
              value={form.customer_name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, customer_name: event.target.value }))
              }
              required
            />
            <input
              className="mp-input"
              type="email"
              placeholder="Email address"
              value={form.customer_email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, customer_email: event.target.value }))
              }
              required
            />
            <textarea
              className="mp-textarea full"
              rows="4"
              placeholder="Shipping address"
              value={form.shipping_address}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  shipping_address: event.target.value,
                }))
              }
            />
            <textarea
              className="mp-textarea full"
              rows="3"
              placeholder="Order notes"
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
            <div className="mp-row-between full">
              <strong>Total: {formatCurrency(cart.subtotal)}</strong>
              <button type="submit" className="mp-btn" disabled={saving}>
                {saving ? "Placing order..." : "Place order"}
              </button>
            </div>
          </form>
        </div>
      )}
    </MarketplaceDashboardShell>
  );
}
