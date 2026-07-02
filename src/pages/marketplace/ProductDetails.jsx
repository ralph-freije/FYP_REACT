import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaExclamationTriangle, FaShoppingCart, FaStore } from "react-icons/fa";
import {
  addToCart,
  getMarketplaceProduct,
} from "../../api/marketplaceApi";
import { PublicShell } from "../public/PublicPages";
import {
  MarketplaceImage,
  ProductCard,
  StateBlock,
  formatCurrency,
  getErrorMessage,
} from "./MarketplaceShared";

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getMarketplaceProduct(slug);
        setProduct(response.data.product || null);
      } catch (err) {
        setError(getErrorMessage(err, "Product not found."));
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    try {
      setSaving(true);
      setNotice("");
      await addToCart(product.id, 1);
      setNotice("Added to cart.");
      window.dispatchEvent(new Event("marketplace-cart-updated"));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to add product to cart."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PublicShell>
      {loading ? (
        <StateBlock title="Loading product..." icon={<FaShoppingCart />}>
          Getting the latest product details.
        </StateBlock>
      ) : error && !product ? (
        <StateBlock title="Product unavailable" tone="error" icon={<FaExclamationTriangle />}>
          {error}
        </StateBlock>
      ) : !product ? (
        <StateBlock title="Product not found" tone="error">
          The product may have been removed or unpublished.
        </StateBlock>
      ) : (
        <>
          <section className="mp-detail">
            <div className="mp-detail-media">
              <MarketplaceImage
                product={product}
                alt={product.name}
                seed={`detail-${product.id}`}
              />
            </div>

            <article className="mp-detail-panel mp-card">
              <span className="mp-pill">{product.category || "Eco Product"}</span>
              <h1>{product.name}</h1>
              <div className="mp-price">{formatCurrency(product.price)}</div>
              <p className="mp-muted">{product.description || product.impact_summary}</p>

              {product.impact_summary && (
                <div className="mp-alert success">{product.impact_summary}</div>
              )}

              {error && <div className="mp-alert error">{error}</div>}
              {notice && <div className="mp-alert success">{notice}</div>}

              <div className="mp-row-between">
                <span className="mp-muted">
                  {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
                {product.store && (
                  <Link to={`/stores/${product.store.slug}`} className="mp-store-link">
                    <FaStore /> {product.store.name}
                  </Link>
                )}
              </div>

              <div className="mp-actions">
                <button
                  type="button"
                  className="mp-btn"
                  onClick={handleAddToCart}
                  disabled={saving || product.stock < 1}
                >
                  <FaShoppingCart />
                  {saving ? "Adding..." : "Add to cart"}
                </button>
                <Link to="/marketplace" className="mp-btn-light">
                  Continue shopping
                </Link>
              </div>
            </article>
          </section>

          {product.related_products?.length > 0 && (
            <section className="public-section">
              <div className="public-section-head">
                <span className="public-kicker">More from this store</span>
                <h2>Related products</h2>
              </div>
              <div className="mp-grid">
                {product.related_products.map((related) => (
                  <ProductCard product={related} key={related.id} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PublicShell>
  );
}
