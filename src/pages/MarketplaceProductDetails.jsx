import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaChevronRight,
  FaCreditCard,
  FaLeaf,
  FaMinus,
  FaPlus,
  FaRecycle,
  FaRegStar,
  FaShieldAlt,
  FaShoppingCart,
  FaStar,
  FaStore,
  FaTruck,
  FaUserCircle,
} from "react-icons/fa";
import { FiArrowLeft, FiPackage, FiRefreshCw } from "react-icons/fi";
import { addProductToCart, getCart, getMarketplaceProduct, submitProductReview } from "../api/marketplaceApi";
import { PublicShell } from "./public/PublicPages";
import MarketplaceProductCard from "../components/MarketplaceProductCard";
import "./MarketplaceProductDetails.css";
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


function stockMeta(stock) {
  const amount = numberOf(stock);
  if (amount <= 0) return { text: "Out of stock", className: "out", note: "This product is currently unavailable." };
  if (amount <= 8) return { text: "Low stock", className: "low", note: `Only ${amount} left in stock.` };
  return { text: "In stock", className: "in", note: `${amount} units available.` };
}

function RatingStars({ rating = 0, size = "normal", interactive = false, value = 0, onChange }) {
  const roundedRating = Math.round(numberOf(rating));
  return (
    <span className={`stars ${size} ${interactive ? "interactive" : ""}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = interactive ? star <= value : star <= roundedRating;
        const Icon = isFilled ? FaStar : FaRegStar;
        return interactive ? (
          <button key={star} type="button" aria-label={`${star} star${star > 1 ? "s" : ""}`} onClick={() => onChange?.(star)}>
            <Icon />
          </button>
        ) : <Icon key={star} />;
      })}
    </span>
  );
}

function TabButton({ active, children, onClick }) {
  return <button className={active ? "active" : ""} type="button" onClick={onClick}>{children}</button>;
}

function RelatedProductCard({ product }) {
  const ecoScore = numberOf(product.eco_score, 86);
  return (
    <Link to={`/marketplace/products/${product.slug}`} className="related-product-card">
      <div className="related-product-image">
        <img src={getProductImage(product)} alt={product.name} onError={handleProductImageError} />
      </div>
      <h4>{product.name}</h4>
      <div><strong>{money(product.price)}</strong><span>{Math.round(ecoScore)} Eco</span></div>
    </Link>
  );
}

function ReviewCard({ review }) {
  return (
    <article className="review-card">
      <div className="review-avatar"><FaUserCircle /></div>
      <div>
        <div className="review-card-head">
          <div>
            <h4>{review.user_name || "EcoTrack user"}</h4>
            <small>{review.created_at || "Marketplace review"}</small>
          </div>
          <RatingStars rating={review.rating} size="small" />
        </div>
        <p>{review.comment || "No written comment was added."}</p>
      </div>
    </article>
  );
}


function ProductImageSvgDesign({ ecoScore, carbonSaving, tags = [] }) {
  const tagPreview = tags.length ? tags.slice(0, 2).join(" • ") : "Verified materials";
  return (
    <section className="product-image-svg-design" aria-label="Product sustainability highlights">
      <article>
        <div className="svg-badge-wrap">
          <svg viewBox="0 0 96 96" role="img" aria-hidden="true">
            <circle cx="48" cy="48" r="38" fill="#d1fae5" />
            <path d="M58 22c-18 2-31 13-31 29 0 11 8 20 19 20 16 0 27-17 24-41-.2-2-1.8-3.5-3.8-3.6-3-.2-5.8-.1-8.2-.4Z" fill="#10b981" />
            <path d="M28 71c10-24 25-33 39-40" fill="none" stroke="#073b2c" strokeWidth="5" strokeLinecap="round" />
            <path d="M42 54c4 1 9 1 14-.8" fill="none" stroke="#073b2c" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <strong>{Math.round(ecoScore)}/100 Eco Score</strong>
          <span>Product impact is measured and displayed clearly.</span>
        </div>
      </article>

      <article>
        <div className="svg-badge-wrap blue">
          <svg viewBox="0 0 96 96" role="img" aria-hidden="true">
            <rect x="18" y="26" width="60" height="44" rx="18" fill="#dbeafe" />
            <path d="M28 55c7 8 15 11 25 8 11-3 17-12 16-24" fill="none" stroke="#3b82f6" strokeWidth="7" strokeLinecap="round" />
            <path d="M64 34l7 7 7-7" fill="none" stroke="#3b82f6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M28 39h16M28 49h10" stroke="#073b2c" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <strong>{carbonSaving ? `${numberOf(carbonSaving).toFixed(1)} kg CO₂` : "CO₂ tracked"}</strong>
          <span>Estimated monthly carbon saving is shown before purchase.</span>
        </div>
      </article>

      <article>
        <div className="svg-badge-wrap gold">
          <svg viewBox="0 0 96 96" role="img" aria-hidden="true">
            <path d="M48 14l26 10v18c0 19-10 33-26 40-16-7-26-21-26-40V24l26-10Z" fill="#fef3c7" />
            <path d="M48 18l22 8v16c0 16-8 28-22 35-14-7-22-19-22-35V26l22-8Z" fill="none" stroke="#f59e0b" strokeWidth="6" strokeLinejoin="round" />
            <path d="M36 48l8 8 18-20" fill="none" stroke="#073b2c" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <strong>{tagPreview}</strong>
          <span>Seller claims and sustainability tags stay visible.</span>
        </div>
      </article>
    </section>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div className="product-detail-skeleton">
      <span /><span /><span /><span />
    </div>
  );
}

function MarketplaceProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");
  const [cartLoading, setCartLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");


  const refreshCartCount = async () => {
    if (!localStorage.getItem("token")) {
      setCartCount(0);
      return;
    }

    try {
      const response = await getCart();
      setCartCount(Number(response?.data?.count || 0));
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    refreshCartCount();
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setCartMessage("");
    setCartError("");
    setReviewMessage("");
    setReviewError("");

    getMarketplaceProduct(slug)
      .then((response) => {
        if (!active) return;
        const loadedProduct = response?.data?.product;
        setProduct(loadedProduct || null);
        setQuantity(loadedProduct?.stock > 0 ? 1 : 0);
      })
      .catch(() => active && setError("Could not load this product. It may have been removed or the marketplace API is not running."))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [slug]);

  const tags = useMemo(() => splitTags(product), [product]);
  const stock = stockMeta(product?.stock);
  const ecoScore = numberOf(product?.eco_score, 89);
  const carbonSaving = product?.carbon_saving_value ?? product?.carbon_saving_kg;
  const related = useMemo(() => (product?.related_products || []).slice(0, 4), [product]);
  const reviews = product?.reviews || [];
  const averageRating = numberOf(product?.average_rating, 0);
  const reviewsCount = numberOf(product?.reviews_count, 0);
  const ratingText = reviewsCount ? `${averageRating.toFixed(1)} (${reviewsCount} review${reviewsCount === 1 ? "" : "s"})` : "No reviews yet";
  const description = product?.description || "This sustainable marketplace product is listed by a verified EcoTrack seller with clear environmental impact information.";
  const category = product?.category || "Eco Product";
  const storeName = product?.store?.name || product?.store_name || "Verified Eco Seller";
  const storeSlug = product?.store?.slug || product?.store_slug || null;

  const handleQuantityChange = (direction) => {
    setQuantity((current) => {
      const next = current + direction;
      return Math.max(1, Math.min(numberOf(product?.stock, 1), next));
    });
  };

  const handleAddToCart = async (goToCart = false) => {
    if (!product || numberOf(product.stock) <= 0) return;
    setCartMessage("");
    setCartError("");

    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    try {
      setCartLoading(true);
      const response = await addProductToCart(product.id, quantity);
      setCartCount(Number(response?.data?.count || 0));
      setCartMessage("Product added to cart.");
      if (goToCart) navigate("/cart");
    } catch {
      setCartError("Could not add this product to cart. Please try again.");
    } finally {
      setCartLoading(false);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!product) return;

    setReviewMessage("");
    setReviewError("");

    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    try {
      setReviewLoading(true);
      const response = await submitProductReview(product.id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      if (response?.data?.product) setProduct(response.data.product);
      setReviewComment("");
      setReviewMessage("Review saved successfully.");
    } catch (err) {
      const message = err?.response?.data?.message || "Could not save your review. Please check the rating and try again.";
      setReviewError(message);
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <PublicShell>
      <main className="product-detail-page">
        <div className="product-detail-top-actions">
          <button type="button" className="product-detail-back" onClick={() => navigate(-1)}><FiArrowLeft /> Back</button>
          <Link to="/cart" className="product-detail-cart-link" aria-label={`EcoCart with ${cartCount} item${cartCount === 1 ? "" : "s"}`}><FaShoppingCart /> EcoCart <span className="product-detail-cart-count">{cartCount}</span></Link>
        </div>

        {loading ? <ProductDetailsSkeleton /> : error ? (
          <section className="product-detail-empty">
            <FiRefreshCw />
            <h1>Product unavailable</h1>
            <p>{error}</p>
            <Link to="/marketplace" className="product-detail-primary-link">Back to Marketplace</Link>
          </section>
        ) : product ? <>
          <nav className="product-breadcrumb" aria-label="Breadcrumb">
            <Link to="/marketplace">Marketplace</Link>
            <FaChevronRight />
            {storeSlug ? <Link to={`/stores/${storeSlug}`}>{storeName}</Link> : <span>{storeName}</span>}
            <FaChevronRight />
            <span>{product.name}</span>
          </nav>

          <section className="product-detail-grid">
            <div className="product-gallery-column">
              <div className="product-main-image-card">
                <img src={getProductImage(product)} alt={product.name} onError={handleProductImageError} />
                <div className="product-image-badges">
                  {(tags.length ? tags : ["Verified", category]).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </div>
              <ProductImageSvgDesign ecoScore={ecoScore} carbonSaving={carbonSaving} tags={tags} />
            </div>

            <div className="product-info-column">
              <div className="product-title-block">
                <div className="product-meta-row">
                  <span className="product-category-pill">{category}</span>
                  {storeSlug ? (
                    <Link to={`/stores/${storeSlug}`} className="seller-verified-line seller-verified-link"><FaStore /> {storeName} <FaShieldAlt /></Link>
                  ) : <span className="seller-verified-line"><FaStore /> {storeName} <FaShieldAlt /></span>}
                </div>
                <h1>{product.name}</h1>
                <div className="product-rating-row">
                  <RatingStars rating={averageRating} />
                  <small>{ratingText}</small>
                </div>
              </div>

              <div className="product-price-row">
                <strong>{money(product.price)}</strong>
                <span className={`detail-stock-badge ${stock.className}`}>{stock.text}</span>
              </div>

              <p className="product-short-description">{description}</p>

              <section className="eco-impact-panel">
                <div className="impact-panel-head">
                  <span><FaLeaf /></span>
                  <div><h2>Eco Impact</h2><p>Environmental value from this product listing</p></div>
                </div>
                <div className="impact-metrics-grid">
                  <article>
                    <small>Carbon Saving</small>
                    <strong>{carbonSaving ? `${numberOf(carbonSaving).toFixed(1)} kg CO₂` : "Tracked"}<em>/month</em></strong>
                  </article>
                  <article className="score-ring-wrap">
                    <div className="score-ring" style={{ "--score": Math.min(100, Math.max(0, ecoScore)) }}><span>{Math.round(ecoScore)}</span></div>
                    <small>Eco Score</small>
                  </article>
                </div>
                <div className="impact-materials"><b>Materials</b><span>{tags.length ? tags.join(", ") : product.impact_summary || "Sustainable materials listed by seller"}</span></div>
                <div className="impact-tags">{(tags.length ? tags : ["Verified", "Sustainable"]).map((tag) => <span key={tag}>{tag}</span>)}</div>
                <p className="why-it-matters"><FaCheckCircle /> {product.impact_summary || "This product helps support lower-waste shopping habits and verified sustainable sellers."}</p>
              </section>

              <section className="purchase-panel">
                <div className="quantity-row">
                  <div className="quantity-control" aria-label="Quantity selector">
                    <button type="button" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}><FaMinus /></button>
                    <span>{quantity}</span>
                    <button type="button" onClick={() => handleQuantityChange(1)} disabled={quantity >= numberOf(product.stock)}><FaPlus /></button>
                  </div>
                  <p>{stock.note}</p>
                </div>
                <div className="purchase-actions">
                  <button type="button" className="add-to-cart-main" onClick={() => handleAddToCart(false)} disabled={cartLoading || numberOf(product.stock) <= 0}><FaShoppingCart /> {cartLoading ? "Adding..." : "Add to Cart"}</button>
                  <button type="button" className="buy-now-main" onClick={() => handleAddToCart(true)} disabled={cartLoading || numberOf(product.stock) <= 0}><FaCreditCard /> Buy Now</button>
                </div>
                {cartMessage && <p className="cart-feedback success"><FaCheckCircle /> {cartMessage}</p>}
                {cartError && <p className="cart-feedback error">{cartError}</p>}
              </section>
            </div>
          </section>

          <section className="product-tabs-section">
            <div className="product-tabs">
              <TabButton active={activeTab === "description"} onClick={() => setActiveTab("description")}>Description</TabButton>
              <TabButton active={activeTab === "sustainability"} onClick={() => setActiveTab("sustainability")}>Sustainability</TabButton>
              <TabButton active={activeTab === "shipping"} onClick={() => setActiveTab("shipping")}>Shipping</TabButton>
              <TabButton active={activeTab === "reviews"} onClick={() => setActiveTab("reviews")}>Reviews ({reviewsCount})</TabButton>
            </div>

            <div className="tab-content-card">
              {activeTab === "description" && <div className="tab-copy">
                <p>{description}</p>
                <ul>
                  <li><FaCheckCircle /> Listed by a verified EcoTrack marketplace seller.</li>
                  <li><FaCheckCircle /> Includes clear eco score and carbon-saving information.</li>
                  <li><FaCheckCircle /> Stock and price are loaded directly from the marketplace database.</li>
                </ul>
              </div>}

              {activeTab === "sustainability" && <div className="sustainability-grid">
                <article><FaLeaf /><h3>Eco Score</h3><p>{Math.round(ecoScore)}/100 based on the product data available in EcoTrack.</p></article>
                <article><FaRecycle /><h3>Sustainability Tags</h3><p>{tags.length ? tags.join(", ") : "No extra tags were added yet."}</p></article>
                <article><FiPackage /><h3>Packaging</h3><p>Seller packaging information can be expanded when the product form is rebuilt.</p></article>
                <article><FaBoxOpen /><h3>Reuse / Recycling</h3><p>Use the product as intended and follow seller instructions for responsible disposal.</p></article>
              </div>}

              {activeTab === "shipping" && <div className="shipping-info-card">
                <article><FaTruck /><div><h3>Delivery</h3><p>Delivery details will be calculated during checkout based on the shipping address.</p></div></article>
                <article><FaStore /><div><h3>Seller</h3><p>{storeName}</p></div></article>
                <article><FaShieldAlt /><div><h3>Trust</h3><p>Orders are connected to verified sellers and tracked through the marketplace flow.</p></div></article>
              </div>}

              {activeTab === "reviews" && <div className="reviews-content">
                <section className="reviews-summary-card">
                  <div>
                    <strong>{reviewsCount ? averageRating.toFixed(1) : "—"}</strong>
                    <RatingStars rating={averageRating} />
                    <p>{reviewsCount ? `Based on ${reviewsCount} customer review${reviewsCount === 1 ? "" : "s"}.` : "No reviews yet. Be the first to rate this product."}</p>
                  </div>
                  <form className="review-form" onSubmit={handleReviewSubmit}>
                    <h3>Add your review</h3>
                    <RatingStars interactive value={reviewRating} onChange={setReviewRating} />
                    <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} maxLength={1000} placeholder="Share your experience with this product..." />
                    <button type="submit" disabled={reviewLoading}>{reviewLoading ? "Saving..." : "Submit Review"}</button>
                    {reviewMessage && <p className="review-feedback success"><FaCheckCircle /> {reviewMessage}</p>}
                    {reviewError && <p className="review-feedback error">{reviewError}</p>}
                  </form>
                </section>
                {reviews.length ? <div className="reviews-list">{reviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div> : (
                  <div className="reviews-empty-card">
                    <FaStar />
                    <h3>No reviews yet</h3>
                    <p>Customer review cards will appear here after users rate this product.</p>
                  </div>
                )}
              </div>}
            </div>
          </section>

          <section className="seller-mini-card">
            <div className="seller-logo"><FaStore /></div>
            <div>
              <span className="seller-status"><FaShieldAlt /> Verified Seller</span>
              <h2>{storeName}</h2>
              <p>{product.store?.description || "Approved EcoTrack seller offering sustainable marketplace products."}</p>
            </div>
            <Link to={storeSlug ? `/stores/${storeSlug}` : "/marketplace"} className="seller-store-button">View Store</Link>
          </section>

          <section className="related-products-section">
            <div className="related-head">
              <div><h2>You may also like</h2><p>Four more sustainable products from this seller or category.</p></div>
              <Link to="/marketplace">View Marketplace</Link>
            </div>
            {related.length ? <div className="related-products-grid marketplace-product-grid product-detail-related-market-grid">{related.map((item) => <MarketplaceProductCard key={item.id} product={item} compact />)}</div> : <div className="related-empty"><FiPackage /><span>No related products found yet.</span></div>}
          </section>
        </> : null}
      </main>
    </PublicShell>
  );
}

export default MarketplaceProductDetails;
