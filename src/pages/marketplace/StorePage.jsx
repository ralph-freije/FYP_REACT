import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaEnvelope,
  FaLeaf,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaRecycle,
  FaSearch,
  FaShareAlt,
  FaShieldAlt,
  FaShoppingBag,
  FaStar,
  FaStore,
  FaTruck,
  FaUsers,
} from "react-icons/fa";
import { FiPackage, FiRefreshCw } from "react-icons/fi";
import { contactMarketplaceStore, getMarketplaceStore } from "../../api/marketplaceApi";
import MarketplaceProductCard from "../../components/MarketplaceProductCard";
import { PublicShell } from "../public/PublicPages";
import "./StorePage.css";

const numberOf = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const PLACEHOLDER_IMAGE = "/marketplace-product-placeholder.svg";

function StoreState({ title, text, icon, action }) {
  return (
    <PublicShell>
      <section className="store-page-state">
        <div>{icon || <FaStore />}</div>
        <h1>{title}</h1>
        <p>{text}</p>
        {action}
      </section>
    </PublicShell>
  );
}

function StoreLogo({ store }) {
  if (store?.logo_url) {
    return <img src={store.logo_url} alt={`${store.name} logo`} onError={(event) => { event.currentTarget.src = PLACEHOLDER_IMAGE; }} />;
  }

  return <FaLeaf />;
}

export default function StorePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Items");
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getMarketplaceStore(slug)
      .then((response) => {
        if (!active) return;
        setStore(response?.data?.store || null);
      })
      .catch(() => active && setError("Store not found or this seller is not active yet."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [slug]);

  const products = store?.products || [];
  const categories = useMemo(() => {
    const values = products.map((product) => product.category).filter(Boolean);
    return ["All Items", ...Array.from(new Set(values))];
  }, [products]);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesSearch = !search.trim() || `${product.name} ${product.description || ""} ${product.category || ""}`.toLowerCase().includes(search.trim().toLowerCase());
    const matchesCategory = category === "All Items" || product.category === category;
    return matchesSearch && matchesCategory;
  }), [products, search, category]);

  const stats = store?.stats || {};
  const productCategories = store?.product_categories || categories.filter((item) => item !== "All Items");


  const handleContactSeller = async () => {
    if (!store?.slug) return;

    setContactError("");

    try {
      setContactLoading(true);
      const response = await contactMarketplaceStore(store.slug);
      const conversationId = response?.data?.conversation_id;
      const draft = response?.data?.draft || `Hi, I am interested in your store ${store.name} on EcoTrack.`;

      if (conversationId) {
        navigate(`/messages?conversation=${conversationId}&draft=${encodeURIComponent(draft)}`);
        return;
      }

      navigate("/messages");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        navigate(`/login?redirect=${encodeURIComponent(`/stores/${store.slug}`)}`);
        return;
      }
      setContactError(err?.response?.data?.message || "Could not open seller chat right now.");
    } finally {
      setContactLoading(false);
    }
  };

  if (loading) {
    return <StoreState title="Loading store..." text="Getting storefront details and products." icon={<FiRefreshCw />} />;
  }

  if (error || !store) {
    return <StoreState title="Store unavailable" text={error || "This store may be suspended or unpublished."} icon={<FaStore />} action={<Link to="/marketplace" className="store-action-primary">Back to Marketplace</Link>} />;
  }

  return (
    <PublicShell>
      <main className="public-store-page">
        <section className="storefront-hero">
          <div className="storefront-banner">
            {store.banner_url ? <img src={store.banner_url} alt={`${store.name} banner`} /> : null}
            <div className="storefront-banner-pattern" />
          </div>
          <div className="storefront-profile-row">
            <div className="storefront-logo"><StoreLogo store={store} /></div>
            <div className="storefront-profile-content">
              <div>
                <div className="storefront-title-row">
                  <h1>{store.name}</h1>
                  <span><FaShieldAlt /> Verified Seller</span>
                </div>
                <p className="storefront-description">{store.description || "Approved EcoTrack seller offering sustainable products for lower-impact shopping."}</p>
                <div className="storefront-meta-row">
                  <span><FaStar /> {numberOf(stats.rating, 4.8).toFixed(1)} Rating</span>
                  <span><FaMapMarkerAlt /> {store.location || "EcoTrack Marketplace"}</span>
                  <span><FaStore /> Member since {store.member_since || "2026"}</span>
                </div>
              </div>
              <div className="storefront-actions">
                <Link to="/marketplace" className="store-action-primary"><FaShoppingBag /> Marketplace</Link>
                <button type="button" className="store-action-secondary" onClick={handleContactSeller} disabled={contactLoading}>
                  <FaEnvelope /> {contactLoading ? "Opening chat..." : "Contact Seller"}
                </button>
                <button type="button" className="store-action-icon" onClick={() => navigator.clipboard?.writeText(window.location.href)} aria-label="Share store"><FaShareAlt /></button>
              </div>
              {contactError && <p className="store-contact-error">{contactError}</p>}
            </div>
          </div>
        </section>

        <section className="store-stats-grid">
          <article><span><FaBoxOpen /></span><small>Total Products</small><strong>{numberOf(stats.products_count, products.length)} Products</strong></article>
          <article><span className="blue"><FaStar /></span><small>Seller Rating</small><strong>{numberOf(stats.rating, 4.8).toFixed(1)} Rating</strong></article>
          <article><span><FaTruck /></span><small>Successful Orders</small><strong>{numberOf(stats.orders_completed)} Orders</strong></article>
          <article><span><FaLeaf /></span><small>CO₂ Saved</small><strong>{numberOf(stats.carbon_saved).toFixed(1)} kg</strong></article>
        </section>

        <section className="store-tabs" aria-label="Store tabs">
          {[
            ["products", "Products"],
            ["about", "About"],
            ["reviews", "Reviews"],
            ["sustainability", "Sustainability"],
          ].map(([key, label]) => (
            <button key={key} type="button" className={activeTab === key ? "active" : ""} onClick={() => setActiveTab(key)}>{label}</button>
          ))}
        </section>

        <section className="store-content-panel">
          {activeTab === "products" && (
            <div>
              <div className="store-product-tools">
                <div className="store-search-box"><FaSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search within ${store.name}...`} /></div>
                <div className="store-category-chips">
                  {categories.map((item) => <button key={item} type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
                </div>
              </div>
              {filteredProducts.length ? (
                <div className="marketplace-product-grid store-product-grid">
                  {filteredProducts.map((product) => <MarketplaceProductCard key={product.id} product={{ ...product, store }} compact />)}
                </div>
              ) : (
                <div className="store-empty-products"><FiPackage /><h3>No products found</h3><p>Try another category or search term.</p></div>
              )}
            </div>
          )}

          {activeTab === "about" && (
            <div className="store-about-grid">
              <div>
                <h2>Crafting a greener shopping experience.</h2>
                <p>{store.description || "This seller joined EcoTrack to offer sustainable marketplace products with transparent impact information."}</p>
                <div className="store-info-list">
                  {store.contact_email && <span><FaEnvelope /> {store.contact_email}</span>}
                  {store.phone && <span><FaPhoneAlt /> {store.phone}</span>}
                  {store.location && <span><FaMapMarkerAlt /> {store.location}</span>}
                </div>
              </div>
              <aside>
                <h3>Categories</h3>
                <div>{productCategories.length ? productCategories.map((item) => <span key={item}>{item}</span>) : <span>Eco Products</span>}</div>
              </aside>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="store-review-panel">
              <FaStar />
              <h2>{numberOf(stats.rating, 4.8).toFixed(1)} average seller rating</h2>
              <p>Store-level reviews will appear here as the marketplace review system expands. Product reviews are already available inside product details pages.</p>
            </div>
          )}

          {activeTab === "sustainability" && (
            <div className="store-sustainability-grid">
              <article><FaShieldAlt /><h3>Seller Proof</h3><p>{store.proof_url ? "Sustainability proof has been uploaded and reviewed by EcoTrack admins." : "Seller proof is reviewed during the application process."}</p></article>
              <article><FaLeaf /><h3>Sustainability Mission</h3><p>{store.sustainability_reason || "This seller focuses on responsible products and transparent impact information."}</p></article>
              <article><FaRecycle /><h3>Materials</h3><p>{store.materials_overview || "Material details are provided per product and can be expanded in seller product forms."}</p></article>
              <article><FaCheckCircle /><h3>Packaging Practices</h3><p>{store.packaging_practices || "Packaging practices are reviewed by EcoTrack before seller approval."}</p></article>
            </div>
          )}
        </section>
      </main>
    </PublicShell>
  );
}
