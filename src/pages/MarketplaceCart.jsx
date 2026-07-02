import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaCheckCircle,
  FaLeaf,
  FaLock,
  FaMinus,
  FaPlus,
  FaRecycle,
  FaRegTrashAlt,
  FaSeedling,
  FaShoppingBag,
  FaStore,
  FaTruck,
} from "react-icons/fa";
import { FiArrowLeft, FiPackage, FiRefreshCw, FiShoppingCart } from "react-icons/fi";
import { getCart, removeCartItem, updateCartItem } from "../api/marketplaceApi";
import { PublicShell } from "./public/PublicPages";
import "./MarketplaceCart.css";
import { getProductImage, handleProductImageError } from "../utils/productImages";

const numberOf = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const money = (value) => `$${numberOf(value).toFixed(2)}`;


function splitTags(product) {
  const raw = product?.sustainability_tags ?? product?.tags ?? [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return raw.split(",").map((tag) => tag.trim()).filter(Boolean);
    }
  }
  return [];
}

function stockMeta(product) {
  const stock = numberOf(product?.stock);
  if (stock <= 0) return { text: "Out of stock", className: "out", warning: "This item is currently out of stock." };
  if (stock <= 5) return { text: "Low stock", className: "low", warning: `Only ${stock} left in stock.` };
  return { text: "In stock", className: "in", warning: "Ready for checkout." };
}

function CartSkeleton() {
  return (
    <div className="eco-cart-skeleton-list">
      {Array.from({ length: 3 }, (_, index) => <div key={index} className="eco-cart-skeleton"><span /><div><b /><i /><em /></div></div>)}
    </div>
  );
}

function CartItemCard({ item, busy, onQuantityChange, onRemove }) {
  const product = item.product || {};
  const tags = splitTags(product).slice(0, 3);
  const quantity = numberOf(item.quantity, 1);
  const stock = stockMeta(product);
  const carbon = numberOf(product.carbon_saving_value ?? product.carbon_saving_kg) * quantity;

  return (
    <article className="eco-cart-item-card">
      <Link to={product.slug ? `/marketplace/products/${product.slug}` : "/marketplace"} className="eco-cart-item-image">
        <img src={getProductImage(product)} alt={product.name || "Marketplace product"} onError={handleProductImageError} />
      </Link>

      <div className="eco-cart-item-content">
        <div className="eco-cart-item-top">
          <div>
            <Link to={product.slug ? `/marketplace/products/${product.slug}` : "/marketplace"} className="eco-cart-item-title">{product.name || item.product_name || "Marketplace product"}</Link>
            <p className="eco-cart-seller-line"><FaStore /> Sold by {product.store?.name || product.store_name || "Verified Eco Seller"}</p>
          </div>
          <strong className="eco-cart-item-price">{money(product.price || item.unit_price)}</strong>
        </div>

        <div className="eco-cart-tags-row">
          <span className="eco-carbon-chip"><FaLeaf /> Saves {carbon.toFixed(1)} kg CO₂/month</span>
          {tags.map((tag) => <span key={tag}>{tag}</span>)}
        </div>

        <div className="eco-cart-item-bottom">
          <div className="eco-qty-control" aria-label="Quantity selector">
            <button type="button" onClick={() => onQuantityChange(item, quantity - 1)} disabled={busy || quantity <= 1}><FaMinus /></button>
            <span>{quantity}</span>
            <button type="button" onClick={() => onQuantityChange(item, quantity + 1)} disabled={busy || quantity >= numberOf(product.stock, quantity)}><FaPlus /></button>
          </div>

          <div className="eco-stock-wrap">
            <span className={`eco-stock-badge ${stock.className}`}>{stock.text}</span>
            <small>{stock.warning}</small>
          </div>

          <button className="eco-remove-button" type="button" onClick={() => onRemove(item)} disabled={busy}><FaRegTrashAlt /> Remove</button>
        </div>
      </div>
    </article>
  );
}

function BoosterCard({ product }) {
  if (!product) return null;
  const carbon = numberOf(product.carbon_saving_value ?? product.carbon_saving_kg);
  return (
    <Link to={`/marketplace/products/${product.slug}`} className="eco-booster-card">
      <div className="eco-booster-image"><img src={getProductImage(product)} alt={product.name} onError={handleProductImageError} /></div>
      <h3>{product.name}</h3>
      <p>{product.impact_summary || (carbon ? `Could save ${carbon.toFixed(1)} kg CO₂/month.` : "A verified sustainable marketplace product.")}</p>
      <div><strong>{money(product.price)}</strong><span><FiShoppingCart /></span></div>
    </Link>
  );
}

function EmptyCart() {
  return (
    <section className="eco-cart-empty-state">
      <div className="eco-empty-illustration">
        <FaShoppingBag />
        <FaLeaf />
      </div>
      <h2>Your cart is empty</h2>
      <p>Start adding sustainable products to reduce your footprint and support verified eco sellers.</p>
      <Link to="/marketplace" className="eco-cart-primary-btn">Browse Marketplace</Link>
    </section>
  );
}

function MarketplaceCart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], subtotal: 0, count: 0, shipping: 0, discount: 0, total: 0, carbon_saving_total: 0 });
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCart = () => {
    setLoading(true);
    setError("");
    return getCart()
      .then((response) => setCart(response?.data || { items: [] }))
      .catch(() => setError("Could not load your cart. Make sure you are logged in and Laravel is running."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const items = cart.items || [];
  const boosters = (cart.recommendations || []).slice(0, 3);
  const subtotal = numberOf(cart.subtotal);
  const shipping = numberOf(cart.shipping);
  const discount = numberOf(cart.discount);
  const total = numberOf(cart.total, subtotal + shipping - discount);
  const carbonSaving = numberOf(cart.carbon_saving_total);
  const averageEcoScore = numberOf(cart.average_eco_score, 0);
  const itemCount = numberOf(cart.count, items.reduce((sum, item) => sum + numberOf(item.quantity), 0));

  const impactText = useMemo(() => {
    if (!itemCount) return "Your next sustainable choice will appear here.";
    return `This cart may help save ${carbonSaving.toFixed(1)} kg CO₂/month`;
  }, [carbonSaving, itemCount]);

  const handleQuantityChange = async (item, quantity) => {
    if (quantity < 1 || !item?.id) return;
    setBusyItem(item.id);
    setNotice("");
    setError("");
    try {
      const response = await updateCartItem(item.id, quantity);
      setCart(response?.data || { items: [] });
      setNotice("Cart quantity updated.");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not update this cart item.");
    } finally {
      setBusyItem(null);
    }
  };

  const handleRemove = async (item) => {
    if (!item?.id) return;
    setBusyItem(item.id);
    setNotice("");
    setError("");
    try {
      const response = await removeCartItem(item.id);
      setCart(response?.data || { items: [] });
      setNotice("Product removed from cart.");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not remove this cart item.");
    } finally {
      setBusyItem(null);
    }
  };

  return (
    <PublicShell>
      <main className="eco-cart-page">
        <button type="button" className="eco-cart-back" onClick={() => navigate(-1)}><FiArrowLeft /> Back</button>

        <header className="eco-cart-page-head">
          <span className="eco-cart-kicker"><FaSeedling /> Sustainable checkout path</span>
          <h1>Your Eco Cart</h1>
          <p>Review your sustainable choices and estimated environmental savings before checkout.</p>
        </header>

        {error && <div className="eco-cart-alert error"><FiRefreshCw /> {error}</div>}
        {notice && <div className="eco-cart-alert success"><FaCheckCircle /> {notice}</div>}

        <section className="eco-cart-layout">
          <div className="eco-cart-main-column">
            <div className="eco-cart-impact-pulse">
              <span><FaLeaf /></span>
              <div>
                <strong>{impactText}</strong>
                <p>Based on your selected sustainable alternative products.</p>
              </div>
            </div>

            {loading ? <CartSkeleton /> : items.length ? (
              <div className="eco-cart-items-list">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    busy={busyItem === item.id}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            ) : <EmptyCart />}
          </div>

          <aside className="eco-cart-summary-card">
            <h2>Order Summary</h2>
            <div className="eco-summary-lines">
              <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              <div><span>Carbon-neutral shipping</span><strong className="eco-free">{shipping ? money(shipping) : "FREE"}</strong></div>
              {discount > 0 && <div><span>Discount</span><strong>-{money(discount)}</strong></div>}
              <div><span>Item count</span><strong>{itemCount}</strong></div>
            </div>

            <div className="eco-summary-total-row">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>

            <div className="eco-summary-impact-card">
              <div><FaLeaf /><span>Total CO₂ saving</span></div>
              <strong>{carbonSaving.toFixed(1)} kg</strong>
            </div>

            <button className="eco-checkout-btn" type="button" onClick={() => navigate("/checkout")} disabled={!items.length || loading}>
              Proceed to Checkout <FaArrowRight />
            </button>
            <Link to="/marketplace" className="eco-continue-shopping">Continue Shopping</Link>

            <div className="eco-secure-row"><FaLock /> Secure Carbon-Neutral Checkout</div>

            <div className="eco-score-goal">
              <div><span>Eco-Score Goal</span><strong>{Math.round(averageEcoScore || 0)}/100</strong></div>
              <div className="eco-score-track"><i style={{ width: `${Math.min(100, Math.max(0, averageEcoScore || 0))}%` }} /></div>
              <p>{averageEcoScore ? "Your cart is building a stronger sustainable shopping score." : "Add products to start building your cart eco score."}</p>
            </div>
          </aside>
        </section>

        {boosters.length ? (
          <section className="eco-boosters-section">
            <div className="eco-cart-section-title">
              <span><FaRecycle /> Recommendations</span>
              <h2>Sustainability Boosters</h2>
            </div>
            <div className="eco-booster-grid">{boosters.map((product) => <BoosterCard key={product.id} product={product} />)}</div>
          </section>
        ) : null}
      </main>
    </PublicShell>
  );
}

export default MarketplaceCart;
