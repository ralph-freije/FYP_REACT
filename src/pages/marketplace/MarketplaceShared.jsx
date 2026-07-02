import { useState } from "react";
import { Link } from "react-router-dom";
import { FaLeaf, FaStore } from "react-icons/fa";
import { getProductImage } from "../../utils/productImages";
import Sidebar from "../../components/Sidebar";
import "../public/PublicPages.css";
import "./Marketplace.css";

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));

export const getErrorMessage = (error, fallback = "Something went wrong.") => {
  const message = error?.response?.data?.message;

  if (typeof message === "string") {
    return message;
  }

  if (message && typeof message === "object") {
    return Object.values(message).flat().join(" ");
  }

  return fallback;
};

export function MarketplaceImage({ src, product, alt, seed = "eco", className = "" }) {
  const [failed, setFailed] = useState(false);
  const imageSrc = getProductImage(product || src);
  const shouldShowImage = imageSrc && !failed;

  if (shouldShowImage) {
    return (
      <img
        className={`mp-product-image ${className}`}
        src={imageSrc}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className={`mp-image-placeholder ${className}`} aria-label={alt}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id={`mp-grad-${seed}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="24" fill={`url(#mp-grad-${seed})`} />
        <path
          d="M61 82c18-10 28-27 27-48-19 1-36 10-47 27-7 11-8 22-7 29 7 1 17-1 27-8Z"
          fill="#ffffff"
          opacity="0.92"
        />
        <path
          d="M43 78c11-15 24-26 40-36"
          stroke="#047857"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
      <span>{alt || "Eco product"}</span>
    </div>
  );
}

export function StateBlock({ icon, title, children, action, tone = "neutral" }) {
  return (
    <div className={`mp-state ${tone}`}>
      <div className="mp-state-icon">{icon || <FaLeaf />}</div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ProductCard({ product }) {
  return (
    <article className="mp-product-card">
      <Link to={`/marketplace/products/${product.slug}`} className="mp-product-media">
        <MarketplaceImage
          product={product}
          alt={product.name}
          seed={`product-${product.id}`}
        />
      </Link>
      <div className="mp-product-body">
        <div className="mp-product-meta">
          <span>{product.category || "Eco Product"}</span>
          <strong>{formatCurrency(product.price)}</strong>
        </div>
        <h3>
          <Link to={`/marketplace/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <p>{product.impact_summary || product.description || "Sustainable product for lower-impact habits."}</p>
        {product.store && (
          <Link to={`/stores/${product.store.slug}`} className="mp-store-link">
            <FaStore /> {product.store.name}
          </Link>
        )}
      </div>
    </article>
  );
}

export function MarketplaceDashboardShell({ children, title, subtitle, actions }) {
  return (
    <div className="mp-dashboard-layout">
      <Sidebar />
      <main className="mp-dashboard-main marketplace-main">
        <div className="mp-dashboard-container">
          <div className="mp-dashboard-header">
            <div>
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            {actions && <div className="mp-dashboard-actions">{actions}</div>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
