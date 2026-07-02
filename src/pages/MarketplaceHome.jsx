import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaLeaf,
  FaRecycle,
  FaSearch,
  FaShieldAlt,
  FaShoppingBag,
  FaShoppingCart,
  FaSlidersH,
  FaStar,
  FaStore,
  FaTruck,
} from "react-icons/fa";
import { FiPackage, FiRefreshCw, FiXCircle } from "react-icons/fi";
import { addProductToCart, getCart, getMarketplaceProducts } from "../api/marketplaceApi";
import { PublicShell } from "./public/PublicPages";
import MarketplaceProductCard from "../components/MarketplaceProductCard";
import "./MarketplaceHome.css";

const PLACEHOLDER_IMAGE = "/marketplace-product-placeholder.svg";
const FALLBACK_CATEGORIES = [
  "Reusable Products",
  "Solar & Energy",
  "Eco Home",
  "Sustainable Fashion",
  "Food & Kitchen",
  "Stationery",
  "Carbon Offsets",
];
const FALLBACK_TAGS = ["Reusable", "Recycled", "Plastic-free", "Solar", "Biodegradable", "Local"];

const numberOf = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const priceOf = (value) => `$${numberOf(value).toFixed(2)}`;

function stockLabel(stock) {
  const amount = numberOf(stock);
  if (amount <= 0) return { text: "Out of Stock", className: "out" };
  if (amount <= 8) return { text: "Low Stock", className: "low" };
  return { text: "In Stock", className: "in" };
}

function splitTags(product) {
  const raw = product.sustainability_tags ?? product.tags ?? [];
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

function ProductSkeleton() {
  return <div className="marketplace-card product-skeleton"><span /><b /><i /><em /></div>;
}

function MarketplaceHome() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [options, setOptions] = useState({ categories: [], stores: [], tags: [], price_range: { min: 0, max: 200 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartNotice, setCartNotice] = useState("");
  const [cartError, setCartError] = useState("");
  const [addingProductId, setAddingProductId] = useState(null);
  const [cartPreview, setCartPreview] = useState(null);
  const [cartPreviewLoading, setCartPreviewLoading] = useState(false);
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    store_id: "",
    sort: "newest",
    min_price: "",
    max_price: "",
    min_eco_score: "",
    tags: [],
    in_stock: false,
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getMarketplaceProducts(filters)
      .then((response) => {
        if (!active) return;
        const data = response?.data || {};
        setProducts(data.products || []);
        setOptions({
          categories: data.categories || [],
          stores: data.stores || [],
          tags: data.tags || [],
          price_range: data.price_range || { min: 0, max: 200 },
          stats: data.stats || {},
        });
      })
      .catch(() => active && setError("Could not load marketplace products. Make sure Laravel is running and the marketplace tables are migrated/seeded."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [filters]);

  const loadCartPreview = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setCartPreview(null);
      return;
    }

    try {
      setCartPreviewLoading(true);
      const response = await getCart();
      setCartPreview(response?.data || null);
    } catch {
      setCartPreview(null);
    } finally {
      setCartPreviewLoading(false);
    }
  };

  useEffect(() => {
    loadCartPreview();
  }, []);

  const categories = options.categories?.length ? options.categories : FALLBACK_CATEGORIES;
  const tags = options.tags?.length ? options.tags : FALLBACK_TAGS;
  const maxPrice = Math.max(20, Math.ceil(numberOf(options.price_range?.max, 200)));
  const minPrice = Math.max(0, Math.floor(numberOf(options.price_range?.min, 0)));

  const stats = useMemo(() => {
    const productCount = options.stats?.products_count ?? products.length;
    const sellerCount = options.stats?.stores_count ?? options.stores?.length ?? 0;
    const carbon = options.stats?.carbon_saving_total ?? products.reduce((sum, product) => sum + numberOf(product.carbon_saving_value ?? product.carbon_saving_kg), 0);
    const avg = options.stats?.eco_score_average ?? (products.length ? products.reduce((sum, product) => sum + numberOf(product.eco_score, 86), 0) / products.length : 89);
    return [
      ["Sustainable Products", productCount, <FaShoppingBag />],
      ["Verified Sellers", sellerCount, <FaShieldAlt />],
      ["CO₂ Saved", `${numberOf(carbon).toFixed(1)} kg`, <FaLeaf />],
      ["Average Eco Score", Math.round(numberOf(avg, 89)), <FaStar />],
    ];
  }, [options, products]);

  const cartPreviewText = useMemo(() => {
    if (cartPreviewLoading) {
      return { amount: "…", label: "Loading your EcoCart" };
    }

    if (cartPreview && numberOf(cartPreview.count) > 0) {
      return {
        amount: `${priceOf(cartPreview.total)} USD`,
        label: `${cartPreview.count} item${Number(cartPreview.count) === 1 ? "" : "s"} • ${numberOf(cartPreview.carbon_saving_total).toFixed(1)} kg CO₂ saved`,
      };
    }

    if (cartPreview) {
      return { amount: "$0.00 USD", label: "Your EcoCart is empty" };
    }

    const demoTotal = products.slice(0, 2).reduce((sum, product) => sum + numberOf(product.price), 0);
    const demoCarbon = products.slice(0, 2).reduce((sum, product) => sum + numberOf(product.carbon_saving_value ?? product.carbon_saving_kg), 0);

    return {
      amount: `${priceOf(demoTotal || 124)} USD`,
      label: products.length ? `Sample preview • ${numberOf(demoCarbon, 4.8).toFixed(1)} kg CO₂ saved` : "Sample marketplace EcoCart",
    };
  }, [cartPreview, cartPreviewLoading, products]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const toggleTag = (tag) => setFilters((current) => ({
    ...current,
    tags: current.tags.includes(tag) ? current.tags.filter((item) => item !== tag) : [...current.tags, tag],
  }));
  const resetFilters = () => setFilters({ q: "", category: "", store_id: "", sort: "newest", min_price: "", max_price: "", min_eco_score: "", tags: [], in_stock: false });

  const handleAddToCart = async (product) => {
    setCartNotice("");
    setCartError("");

    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    try {
      setAddingProductId(product.id);
      await addProductToCart(product.id, 1);
      setCartNotice(`${product.name} added to cart.`);
      await loadCartPreview();
    } catch (err) {
      setCartError(err?.response?.data?.message || "Could not add this product to your cart.");
    } finally {
      setAddingProductId(null);
    }
  };

  return (
    <PublicShell>
      <section className="marketplace-hero-section">
        <div className="marketplace-glow glow-one" /><div className="marketplace-glow glow-two" />
        <FaLeaf className="floating-market-icon icon-one" /><FaRecycle className="floating-market-icon icon-two" /><FaShoppingBag className="floating-market-icon icon-three" />
        <div className="marketplace-hero-copy">
          <span className="marketplace-kicker"><FaShieldAlt /> Verified Eco Marketplace</span>
          <h1>Shop smarter. <span>Live greener.</span></h1>
          <p>Discover sustainable products from verified sellers and compare the environmental value behind each purchase.</p>
          <div className="marketplace-hero-actions">
            <Link to="/seller/apply" className="public-btn public-btn-primary">Apply as Seller</Link>
            <Link to="/cart" className="public-btn public-btn-glass marketplace-hero-cart-link"><FaShoppingCart /> EcoCart</Link>
          </div>
        </div>
        <div className="marketplace-dashboard-visual">
          <div className="hero-visual-head"><span>Shopping dashboard</span><FiPackage /></div>
          <div className="hero-visual-grid">
            {stats.map(([label, value, icon]) => <div key={label}>{icon}<strong>{loading ? "…" : value}</strong><small>{label}</small></div>)}
          </div>
          <div className="hero-cart-preview">
            <span><FaShoppingCart /> Cart preview</span>
            <div className="hero-cart-preview-data"><b>{cartPreviewText.amount}</b><small>{cartPreviewText.label}</small></div>
          </div>
        </div>
      </section>

      <section className="marketplace-trust-row" id="marketplace-trust">
        <article><FaShieldAlt /><div><b>Verified Sellers</b><span>Approved sustainable stores</span></div></article>
        <article><FaLeaf /><div><b>Low Carbon Products</b><span>Impact displayed clearly</span></div></article>
        <article><FaRecycle /><div><b>Recycled Materials</b><span>Tags and proof ready</span></div></article>
        <article><FaTruck /><div><b>Safe Checkout</b><span>Prepared for orders flow</span></div></article>
      </section>

      <section className="marketplace-page-body" id="marketplace-products">
        <aside className="marketplace-filter-panel">
          <div className="filter-title-row"><h2>Filters</h2><button type="button" onClick={resetFilters}><FiRefreshCw /> Reset</button></div>

          <label className="filter-field"><span>Sort products</span><select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}>
            <option value="newest">Newest</option>
            <option value="price_low_high">Price: Low to High</option>
            <option value="price_high_low">Price: High to Low</option>
            <option value="eco_score_high">Highest Eco Score</option>
            <option value="carbon_saving_high">Highest Carbon Saving</option>
          </select></label>

          <div className="filter-group"><span className="filter-label">Categories</span><button className={!filters.category ? "active" : ""} type="button" onClick={() => updateFilter("category", "")}>All</button>{categories.map((category) => <button className={filters.category === category ? "active" : ""} type="button" key={category} onClick={() => updateFilter("category", category)}>{category}</button>)}</div>

          <label className="filter-field"><span>Seller / Store</span><select value={filters.store_id} onChange={(event) => updateFilter("store_id", event.target.value)}><option value="">All verified sellers</option>{(options.stores || []).map((store) => <option value={store.id} key={store.id}>{store.name}</option>)}</select></label>

          <div className="filter-group"><span className="filter-label">Price range</span><div className="range-values"><b>{priceOf(filters.min_price || minPrice)}</b><b>{priceOf(filters.max_price || maxPrice)}</b></div><input type="range" min={minPrice} max={maxPrice} value={filters.min_price || minPrice} onChange={(event) => updateFilter("min_price", event.target.value)} /><input type="range" min={minPrice} max={maxPrice} value={filters.max_price || maxPrice} onChange={(event) => updateFilter("max_price", event.target.value)} /></div>

          <div className="filter-group"><span className="filter-label">Minimum eco score</span><input type="range" min="0" max="100" value={filters.min_eco_score || 0} onChange={(event) => updateFilter("min_eco_score", event.target.value)} /><b className="eco-filter-value">{filters.min_eco_score || 0}/100</b></div>

          <div className="filter-group"><span className="filter-label">Sustainability tags</span><div className="tag-filter-list">{tags.map((tag) => <button className={filters.tags.includes(tag) ? "active" : ""} type="button" key={tag} onClick={() => toggleTag(tag)}>{tag}</button>)}</div></div>

          <label className="filter-checkbox"><input type="checkbox" checked={filters.in_stock} onChange={(event) => updateFilter("in_stock", event.target.checked)} /> <span>In stock only</span></label>
        </aside>

        <div className="marketplace-product-canvas">
          <div className="marketplace-search-card">
            <div className="market-search-input"><FaSearch /><input value={filters.q} onChange={(event) => updateFilter("q", event.target.value)} placeholder="Search marketplace products..." /></div>
            <button type="button" className="filter-mobile-button"><FaSlidersH /> Filters</button>
          </div>

          {error ? <div className="marketplace-alert"><FiXCircle /> {error}</div> : null}
          {cartError ? <div className="marketplace-alert"><FiXCircle /> {cartError}</div> : null}
          {cartNotice ? <div className="marketplace-alert marketplace-alert-success"><FaShieldAlt /> {cartNotice} <Link to="/cart">View Cart</Link></div> : null}

          <div className="marketplace-results-head"><div><h2>Marketplace Products</h2><p>{loading ? "Loading products..." : `${products.length} products found`}</p></div></div>

          <div className="marketplace-product-grid">
            {loading ? Array.from({ length: 8 }, (_, index) => <ProductSkeleton key={index} />) : products.length ? products.map((product) => <MarketplaceProductCard key={product.id} product={product} addingProductId={addingProductId} onAddToCart={handleAddToCart} />) : <div className="marketplace-empty-state"><FaShoppingBag /><h3>No sustainable products found</h3><p>Try clearing filters or seed more products in the marketplace database.</p><button type="button" className="public-btn public-btn-primary" onClick={resetFilters}>Clear Filters</button></div>}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

export default MarketplaceHome;
