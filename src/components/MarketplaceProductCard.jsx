import { Link, useNavigate } from "react-router-dom";
import { FaLeaf, FaShieldAlt, FaShoppingCart, FaStore } from "react-icons/fa";
import "../pages/MarketplaceHome.css";
import { getProductImage, handleProductImageError } from "../utils/productImages";

const numberOf = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const priceOf = (value) => `$${numberOf(value).toFixed(2)}`;

function stockLabel(stock) {
  const amount = numberOf(stock);
  if (amount <= 0) return { text: "Out of Stock", className: "out" };
  if (amount <= 8) return { text: "Low Stock", className: "low" };
  return { text: "In Stock", className: "in" };
}

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

function getStore(product) {
  if (product?.store) return product.store;
  if (product?.store_slug || product?.store_name) {
    return {
      slug: product.store_slug,
      name: product.store_name,
    };
  }
  return null;
}

export default function MarketplaceProductCard({ product, addingProductId, onAddToCart, compact = false }) {
  const navigate = useNavigate();
  const tags = splitTags(product).slice(0, 3);
  const stock = stockLabel(product?.stock);
  const carbonSaving = product?.carbon_saving_value ?? product?.carbon_saving_kg;
  const ecoScore = numberOf(product?.eco_score, product?.eco_score_average || 86);
  const store = getStore(product);

  const handleStoreClick = (event) => {
    if (!store?.slug) return;
    event.preventDefault();
    event.stopPropagation();
    navigate(`/stores/${store.slug}`);
  };

  const handleAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
      return;
    }
    navigate(localStorage.getItem("token") ? `/marketplace/products/${product.slug}` : "/login");
  };

  return (
    <article className={`marketplace-card product-listing-card ${compact ? "product-listing-card-compact" : ""}`}>
      <Link to={`/marketplace/products/${product.slug}`} className="product-listing-image" aria-label={`View ${product.name}`}>
        <img
          src={getProductImage(product)}
          alt={product?.name || "Marketplace product"}
          onError={handleProductImageError}
        />
        <span className="eco-score-badge"><FaLeaf /> {Math.round(ecoScore)} Score</span>
      </Link>
      <div className="product-listing-body">
        <div className="product-title-row">
          <div>
            <small className="category-pill">{product?.category || "Eco Product"}</small>
            <h3><Link to={`/marketplace/products/${product.slug}`}>{product?.name}</Link></h3>
          </div>
          <strong>{priceOf(product?.price)}</strong>
        </div>
        <button type="button" className="seller-line seller-line-button" onClick={handleStoreClick} disabled={!store?.slug}>
          <FaStore /> {store?.name || "Verified Eco Seller"} <FaShieldAlt />
        </button>
        <div className="product-tags">
          {(tags.length ? tags : [product?.category || "Sustainable"]).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <div className="impact-row">
          <span><FaLeaf /> {carbonSaving ? `Saves ${numberOf(carbonSaving).toFixed(1)} kg CO₂/month` : (product?.impact_summary || "Verified eco impact")}</span>
        </div>
        <div className="stock-action-row">
          <span className={`stock-badge ${stock.className}`}>{stock.text}</span>
          <div className="product-actions">
            <Link to={`/marketplace/products/${product.slug}`} className="view-details-link">View Details</Link>
            <button type="button" className="add-cart-button" onClick={handleAdd} disabled={addingProductId === product?.id || numberOf(product?.stock) <= 0}>
              <FaShoppingCart /> {addingProductId === product?.id ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
