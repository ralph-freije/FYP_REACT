import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBan,
  FaBoxOpen,
  FaEye,
  FaLeaf,
  FaMagic,
  FaSearch,
  FaStore,
  FaTags,
  FaTimes,
  FaWarehouse,
} from "react-icons/fa";
import { getAdminMarketplaceProducts, updateAdminMarketplaceProduct } from "../../api/marketplaceApi";
import {
  MarketplaceDashboardShell,
  MarketplaceImage,
  StateBlock,
  formatCurrency,
  getErrorMessage,
} from "./MarketplaceShared";

const safeNumber = (value) => Number(value || 0);
const formatCarbon = (value) => `${safeNumber(value).toFixed(1)} kg CO₂e`;
const clampScore = (value) => Math.max(0, Math.min(100, Math.round(safeNumber(value))));

export default function AdminMarketplaceProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [savingProductId, setSavingProductId] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminMarketplaceProducts();
      setProducts(response.data.products || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load marketplace products."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);



  const updateProductVisibility = async (product, shouldBeVisible) => {
    try {
      setSavingProductId(product.id);
      setError("");
      const response = await updateAdminMarketplaceProduct(product.id, {
        is_active: shouldBeVisible,
      });
      const updatedProduct = response.data.product;

      setProducts((currentProducts) =>
        currentProducts.map((item) => (item.id === updatedProduct.id ? updatedProduct : item))
      );
      setSelectedProduct((currentProduct) =>
        currentProduct?.id === updatedProduct.id ? updatedProduct : currentProduct
      );
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update product visibility."));
    } finally {
      setSavingProductId(null);
    }
  };


  const stats = useMemo(() => {
    const lowStock = products.filter((product) => safeNumber(product.stock) <= 5).length;
    const hiddenProducts = products.filter((product) => !product.is_active).length;
    const needsImpact = products.filter((product) => product.eco_score === null || product.eco_score === undefined || !safeNumber(product.carbon_saving_value)).length;
    const ecoProducts = products.filter((product) => product.eco_score !== null && product.eco_score !== undefined);
    const avgEco = ecoProducts.length
      ? Math.round(ecoProducts.reduce((sum, product) => sum + safeNumber(product.eco_score), 0) / ecoProducts.length)
      : 0;
    const totalCarbon = products.reduce((sum, product) => sum + safeNumber(product.carbon_saving_value), 0);

    return { lowStock, hiddenProducts, needsImpact, avgEco, totalCarbon };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && product.is_active) ||
        (filter === "hidden" && !product.is_active);

      const haystack = [
        product.name,
        product.category,
        product.description,
        product.impact_summary,
        product.store?.name,
        product.store?.owner?.email,
        product.origin_country,
        ...(Array.isArray(product.sustainability_tags) ? product.sustainability_tags : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [products, query, filter]);

  const filters = [
    { value: "all", label: "All", count: products.length },
    { value: "active", label: "Active", count: products.filter((product) => product.is_active).length },
    { value: "hidden", label: "Hidden", count: stats.hiddenProducts },
  ];

  return (
    <MarketplaceDashboardShell
      title="Product Management"
      subtitle="Review marketplace listings, AI impact data, inventory, and product health."
      actions={
        <>
          <Link to="/admin/stores" className="mp-btn-light">
            Store Management
          </Link>
          <Link to="/admin/seller-applications" className="mp-btn">
            Seller Applications
          </Link>
        </>
      }
    >
      {loading ? (
        <StateBlock title="Loading products..." icon={<FaBoxOpen />}>
          Getting marketplace inventory.
        </StateBlock>
      ) : error && products.length === 0 ? (
        <StateBlock title="Products unavailable" tone="error">
          {error}
        </StateBlock>
      ) : products.length === 0 ? (
        <StateBlock title="No marketplace products" icon={<FaBoxOpen />}>
          Seller products will appear here after stores publish them.
        </StateBlock>
      ) : (
        <div className="admin-management-page product-moderation-page">
          {error && <div className="mp-alert error">{error}</div>}

          <section className="admin-hero-card admin-product-hero-card">
            <div>
              <span className="admin-hero-kicker">
                <FaMagic /> AI moderation
              </span>
              <h2>Product compliance studio</h2>
              <p>
                Inspect AI eco scores, inventory health, and sustainability details while keeping the marketplace
                aligned with sustainable product standards.
              </p>
            </div>
            <div className="admin-hero-score-card product-score">
              <span>Average Eco Score</span>
              <strong>{stats.avgEco}/100</strong>
              <small>{formatCarbon(stats.totalCarbon)} total carbon saved</small>
            </div>
          </section>

          <section className="admin-kpi-grid product-kpis">
            <article className="admin-kpi-card">
              <div className="admin-kpi-icon"><FaBoxOpen /></div>
              <span>Total products</span>
              <strong>{products.length}</strong>
              <small>{stats.hiddenProducts} hidden by admins</small>
            </article>
            <article className="admin-kpi-card success">
              <div className="admin-kpi-icon"><FaMagic /></div>
              <span>Average Eco Score</span>
              <strong>{stats.avgEco}/100</strong>
              <small>Across products with AI data</small>
            </article>
            <article className="admin-kpi-card warning">
              <div className="admin-kpi-icon"><FaWarehouse /></div>
              <span>Low stock</span>
              <strong>{stats.lowStock}</strong>
              <small>5 or fewer items</small>
            </article>
            <article className="admin-kpi-card eco">
              <div className="admin-kpi-icon"><FaLeaf /></div>
              <span>Carbon saved</span>
              <strong>{formatCarbon(stats.totalCarbon)}</strong>
              <small>AI estimated impact</small>
            </article>
          </section>

          <section className="admin-control-bar">
            <div className="admin-status-tabs" role="tablist" aria-label="Product filter">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={filter === item.value ? "active" : ""}
                  onClick={() => setFilter(item.value)}
                >
                  {item.label}
                  <span>{item.count}</span>
                </button>
              ))}
            </div>
            <label className="admin-search-box">
              <FaSearch />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search product, store, category..."
              />
            </label>
          </section>

          <section className="admin-product-grid">
            {filteredProducts.map((product) => {
              const ecoScore = clampScore(product.eco_score);
              const circumference = 125.6;
              const dashOffset = circumference - (ecoScore / 100) * circumference;

              return (
                <article className="admin-product-card" key={product.id}>
                  <button
                    type="button"
                    className="admin-product-media"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <MarketplaceImage
                      product={product}
                      alt={product.name}
                      seed={`admin-product-${product.id}`}
                    />
                  </button>

                  <div className="admin-product-body">
                    <div className="admin-product-title-row">
                      <div>
                        <span>{product.category || "Eco Product"}</span>
                        <h3>{product.name}</h3>
                      </div>
                      <strong>{formatCurrency(product.price)}</strong>
                    </div>

                    <p>{product.impact_summary || product.description || "No product impact summary yet."}</p>

                    <div className="admin-product-metrics">
                      <div className="admin-eco-ring" aria-label={`Eco score ${ecoScore}`}>
                        <svg viewBox="0 0 48 48" aria-hidden="true">
                          <circle cx="24" cy="24" r="20" />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            style={{ strokeDashoffset: dashOffset }}
                          />
                        </svg>
                        <span>{ecoScore}</span>
                      </div>
                      <div>
                        <span>Carbon Saved</span>
                        <strong>{formatCarbon(product.carbon_saving_value)}</strong>
                      </div>
                      <div>
                        <span>Stock</span>
                        <strong>{product.stock ?? 0}</strong>
                      </div>
                    </div>

                    <div className="admin-product-store-row">
                      <FaStore />
                      <span>{product.store?.name || "No store"}</span>
                    </div>

                    <div className="admin-product-actions">
                      <button
                        type="button"
                        className="mp-btn-light"
                        onClick={() => setSelectedProduct(product)}
                      >
                        Review Details
                      </button>
                      <button
                        type="button"
                        className={product.is_active ? "mp-btn-danger" : "mp-btn"}
                        disabled={savingProductId === product.id}
                        onClick={() => updateProductVisibility(product, !product.is_active)}
                      >
                        {savingProductId === product.id
                          ? "Saving..."
                          : product.is_active
                            ? "Hide"
                            : "Restore"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {filteredProducts.length === 0 && (
            <StateBlock title="No products match this view" icon={<FaSearch />}>
              Try changing the search or product filter.
            </StateBlock>
          )}

          {selectedProduct && (
            <div className="admin-modal-overlay" onClick={() => setSelectedProduct(null)}>
              <article className="admin-product-modal" onClick={(event) => event.stopPropagation()}>
                <header className="admin-modal-header">
                  <div>
                    <span>Product review</span>
                    <h3>{selectedProduct.name}</h3>
                  </div>
                  <button type="button" onClick={() => setSelectedProduct(null)} aria-label="Close">
                    <FaTimes />
                  </button>
                </header>

                <div className="admin-modal-content">
                  <div className="admin-modal-gallery">
                    <MarketplaceImage
                      product={selectedProduct}
                      alt={selectedProduct.name}
                      seed={`modal-product-${selectedProduct.id}`}
                    />
                    <div className="admin-seller-box">
                      <div className="admin-seller-avatar">
                        {(selectedProduct.store?.name || "S")[0]?.toUpperCase()}
                      </div>
                      <div>
                        <span>Seller</span>
                        <strong>{selectedProduct.store?.name || "Unknown store"}</strong>
                        <small>{selectedProduct.store?.owner?.email || "No owner email"}</small>
                      </div>
                    </div>
                  </div>

                  <div className="admin-modal-details">
                    <div className="admin-modal-title-row">
                      <span>{selectedProduct.category || "Eco Product"}</span>
                      <strong>{formatCurrency(selectedProduct.price)}</strong>
                    </div>
                    <p>{selectedProduct.description || "No product description available."}</p>

                    <div className="admin-breakdown-grid">
                      <div>
                        <span>Eco Score</span>
                        <strong>{clampScore(selectedProduct.eco_score)}/100</strong>
                        <div className="admin-score-bar">
                          <i style={{ width: `${clampScore(selectedProduct.eco_score)}%` }} />
                        </div>
                      </div>
                      <div>
                        <span>Carbon Saving</span>
                        <strong>{formatCarbon(selectedProduct.carbon_saving_value)}</strong>
                        <small>Relative to regular alternatives</small>
                      </div>
                    </div>

                    <div className="admin-ai-note">
                      <FaMagic />
                      <p>
                        {selectedProduct.ai_impact_explanation ||
                          selectedProduct.impact_summary ||
                          "AI impact explanation has not been generated for this product yet."}
                      </p>
                    </div>

                    {Array.isArray(selectedProduct.sustainability_tags) && selectedProduct.sustainability_tags.length > 0 && (
                      <div className="admin-modal-tags">
                        <span><FaTags /> Sustainability tags</span>
                        <div>
                          {selectedProduct.sustainability_tags.map((tag) => (
                            <em key={tag}>{tag}</em>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="admin-modal-actions">
                      <Link to={`/marketplace/products/${selectedProduct.slug}`} className="mp-btn-light">
                        View Public Page
                      </Link>
                      <button
                        type="button"
                        className={selectedProduct.is_active ? "mp-btn-danger" : "mp-btn"}
                        disabled={savingProductId === selectedProduct.id}
                        onClick={() => updateProductVisibility(selectedProduct, !selectedProduct.is_active)}
                      >
                        {savingProductId === selectedProduct.id ? (
                          "Saving..."
                        ) : selectedProduct.is_active ? (
                          <><FaBan /> Hide Product</>
                        ) : (
                          <><FaEye /> Restore Product</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          )}
        </div>
      )}
    </MarketplaceDashboardShell>
  );
}
