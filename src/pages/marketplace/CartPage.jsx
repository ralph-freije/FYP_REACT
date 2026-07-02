import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaShoppingCart, FaTrash } from "react-icons/fa";
import {
  getCart,
  removeCartItem,
  updateCartItem,
} from "../../api/marketplaceApi";
import {
  MarketplaceDashboardShell,
  MarketplaceImage,
  StateBlock,
  formatCurrency,
  getErrorMessage,
} from "./MarketplaceShared";

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], subtotal: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  const loadCart = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getCart();
      setCart(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load cart."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (itemId, quantity) => {
    try {
      setSavingId(itemId);
      setError("");
      const response = await updateCartItem(itemId, Number(quantity));
      setCart(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update cart."));
    } finally {
      setSavingId(null);
    }
  };

  const removeItem = async (itemId) => {
    try {
      setSavingId(itemId);
      setError("");
      const response = await removeCartItem(itemId);
      setCart(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to remove cart item."));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <MarketplaceDashboardShell
      title="Cart"
      subtitle="Review items before checkout."
      actions={<Link to="/marketplace" className="mp-btn-light">Continue shopping</Link>}
    >
      {loading ? (
        <StateBlock title="Loading cart..." icon={<FaShoppingCart />}>
          Checking your saved marketplace items.
        </StateBlock>
      ) : error ? (
        <StateBlock title="Cart unavailable" tone="error">
          {error}
        </StateBlock>
      ) : cart.items.length === 0 ? (
        <StateBlock
          title="Your cart is empty"
          icon={<FaShoppingCart />}
          action={<Link to="/marketplace" className="mp-btn">Browse products</Link>}
        >
          Add marketplace products and they will appear here.
        </StateBlock>
      ) : (
        <>
          {error && <div className="mp-alert error">{error}</div>}
          <section className="mp-cart-list">
            {cart.items.map((item) => (
              <article className="mp-cart-item" key={item.id}>
                <MarketplaceImage
                  product={item.product || item}
                  alt={item.product?.name}
                  seed={`cart-${item.id}`}
                  className="mp-cart-thumb"
                />
                <div>
                  <h3>
                    <Link
                      to={`/marketplace/products/${item.product?.slug}`}
                      className="mp-link"
                    >
                      {item.product?.name || "Unavailable product"}
                    </Link>
                  </h3>
                  <p className="mp-muted">
                    {formatCurrency(item.product?.price)} each
                    {item.product?.stock !== undefined
                      ? ` - ${item.product.stock} in stock`
                      : ""}
                  </p>
                </div>
                <div className="mp-inline-actions">
                  <input
                    className="mp-input mp-quantity"
                    type="number"
                    min="1"
                    max={item.product?.stock || 99}
                    value={item.quantity}
                    disabled={savingId === item.id}
                    onChange={(event) =>
                      updateQuantity(item.id, event.target.value || 1)
                    }
                  />
                  <strong>{formatCurrency(item.line_total)}</strong>
                  <button
                    type="button"
                    className="mp-btn-danger"
                    onClick={() => removeItem(item.id)}
                    disabled={savingId === item.id}
                    aria-label="Remove item"
                  >
                    <FaTrash />
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="mp-card">
            <div className="mp-row-between">
              <div>
                <span className="mp-muted">{cart.count} items</span>
                <h2>Total: {formatCurrency(cart.subtotal)}</h2>
              </div>
              <Link to="/checkout" className="mp-btn">
                Checkout
              </Link>
            </div>
          </section>
        </>
      )}
    </MarketplaceDashboardShell>
  );
}
