import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaShoppingBag } from "react-icons/fa";
import { getMarketplaceProducts } from "../../api/marketplaceApi";
import { PublicShell } from "../public/PublicPages";
import {
  ProductCard,
  StateBlock,
  getErrorMessage,
} from "./MarketplaceShared";

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = async (filters = {}) => {
    try {
      setLoading(true);
      setError("");
      const response = await getMarketplaceProducts(filters);
      setProducts(response.data.products || []);
      setCategories(response.data.categories || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load marketplace products."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const hasFilters = useMemo(() => search.trim() || category, [search, category]);

  const handleSubmit = (event) => {
    event.preventDefault();
    loadProducts({
      q: search.trim() || undefined,
      category: category || undefined,
    });
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    loadProducts();
  };

  return (
    <PublicShell>
      <section className="public-section public-top-section mp-marketplace">
        <div className="public-section-head">
          <span className="public-kicker">Marketplace</span>
          <h1>Eco products from approved stores.</h1>
          <p>Browse publicly, then sign in when you are ready to add items to your cart.</p>
        </div>
      </section>

      <form className="mp-toolbar" onSubmit={handleSubmit}>
        <input
          className="mp-search"
          type="search"
          placeholder="Search products"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="mp-select"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option value={item} key={item}>
              {item}
            </option>
          ))}
        </select>
        <button className="mp-btn" type="submit">
          <FaSearch /> Search
        </button>
      </form>

      {loading ? (
        <StateBlock title="Loading marketplace..." icon={<FaShoppingBag />}>
          Finding products and stores.
        </StateBlock>
      ) : error ? (
        <StateBlock title="Marketplace unavailable" tone="error">
          {error}
        </StateBlock>
      ) : products.length === 0 ? (
        <StateBlock
          title={hasFilters ? "No products match your filters" : "No products yet"}
          icon={<FaShoppingBag />}
          action={
            hasFilters ? (
              <button type="button" className="mp-btn-light" onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              <Link to="/seller/apply" className="mp-btn">
                Become a seller
              </Link>
            )
          }
        >
          {hasFilters
            ? "Try a different search or category."
            : "Approved seller products will appear here when stores publish them."}
        </StateBlock>
      ) : (
        <section className="mp-grid" aria-label="Marketplace products">
          {products.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </section>
      )}
    </PublicShell>
  );
}
