import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const APP_NAME = "EcoTrack";
const APP_ICON = "/ecotrack-logo.png";

const PAGE_TITLES = [
  { pattern: /^\/$/, title: "Home" },
  { pattern: /^\/about\/?$/, title: "About Us" },
  { pattern: /^\/contact\/?$/, title: "Contact" },
  { pattern: /^\/login\/?$/, title: "Login" },
  { pattern: /^\/register\/?$/, title: "Create Account" },
  { pattern: /^\/forgot-password\/?$/, title: "Forgot Password" },
  { pattern: /^\/reset-password\/?$/, title: "Reset Password" },
  { pattern: /^\/oauth-success\/?$/, title: "Login Success" },

  { pattern: /^\/dashboard\/?$/, title: "Dashboard" },
  { pattern: /^\/activity\/?$/, title: "Track Activity" },
  { pattern: /^\/track\/?$/, title: "Track Activity" },
  { pattern: /^\/history\/?$/, title: "Activity History" },
  { pattern: /^\/communities\/?$/, title: "Communities" },
  { pattern: /^\/people\/?$/, title: "People" },
  { pattern: /^\/messages\/?$/, title: "Messages" },
  { pattern: /^\/notifications\/?$/, title: "Notifications" },
  { pattern: /^\/leaderboards\/?$/, title: "Leaderboards" },
  { pattern: /^\/challenges\/?$/, title: "Daily Challenges" },
  { pattern: /^\/settings\/?$/, title: "Settings" },

  { pattern: /^\/marketplace\/?$/, title: "Marketplace" },
  { pattern: /^\/marketplace\/products\/[^/]+\/?$/, title: "Product Details" },
  { pattern: /^\/stores\/[^/]+\/?$/, title: "Seller Store" },
  { pattern: /^\/cart\/?$/, title: "Cart" },
  { pattern: /^\/checkout\/?$/, title: "Checkout" },
  { pattern: /^\/orders\/?$/, title: "Orders" },
  { pattern: /^\/orders\/[^/]+\/success\/?$/, title: "Order Success" },
  { pattern: /^\/orders\/[^/]+\/failed\/?$/, title: "Order Failed" },

  { pattern: /^\/seller\/apply\/?$/, title: "Seller Application" },
  { pattern: /^\/seller\/dashboard\/?$/, title: "Seller Dashboard" },
  { pattern: /^\/seller\/products\/?$/, title: "Seller Products" },
  { pattern: /^\/seller\/products\/new\/?$/, title: "Add Product" },
  { pattern: /^\/seller\/products\/[^/]+\/edit\/?$/, title: "Edit Product" },
  { pattern: /^\/seller\/orders\/?$/, title: "Seller Orders" },
  { pattern: /^\/seller\/store-settings\/?$/, title: "Store Settings" },

  { pattern: /^\/admin\/?$/, title: "Admin Dashboard" },
  { pattern: /^\/admin\/challenges\/?$/, title: "Admin Challenges" },
  { pattern: /^\/admin\/seller-applications\/?$/, title: "Seller Applications" },
  { pattern: /^\/admin\/stores\/?$/, title: "Admin Stores" },
  { pattern: /^\/admin\/marketplace-products\/?$/, title: "Product Moderation" },
];

function getPageTitle(pathname) {
  const match = PAGE_TITLES.find((item) => item.pattern.test(pathname));
  return match ? `${match.title} | ${APP_NAME}` : APP_NAME;
}

function ensureIconLink(rel, href, attrs = {}) {
  let link = document.head.querySelector(`link[rel="${rel}"]`);

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }

  link.setAttribute("href", href);
  Object.entries(attrs).forEach(([key, value]) => link.setAttribute(key, value));
}

export default function PageMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = getPageTitle(pathname);

    ensureIconLink("icon", APP_ICON, { type: "image/png" });
    ensureIconLink("shortcut icon", APP_ICON, { type: "image/png" });
    ensureIconLink("apple-touch-icon", APP_ICON);
  }, [pathname]);

  return null;
}
