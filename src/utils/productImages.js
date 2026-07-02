import api from "../api/axios";

export const PRODUCT_IMAGE_PLACEHOLDER = "/marketplace-product-placeholder.svg";

export function apiOrigin() {
  try {
    return new URL(api.defaults.baseURL || window.location.origin).origin;
  } catch {
    return "http://127.0.0.1:8000";
  }
}

export function normalizeProductImagePath(path) {
  const raw = String(path || "").trim();

  if (!raw) return PRODUCT_IMAGE_PLACEHOLDER;
  if (raw.startsWith("blob:") || raw.startsWith("data:")) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `${window.location.protocol}${raw}`;

  const cleaned = raw
    .replace(/^public\//, "")
    .replace(/^storage\/app\/public\//, "")
    .replace(/^app\/public\//, "")
    .replace(/^public\/storage\//, "storage/")
    .replace(/^\/+/, "");

  if (!cleaned) return PRODUCT_IMAGE_PLACEHOLDER;

  const origin = apiOrigin();

  if (cleaned.startsWith("storage/")) {
    return `${origin}/${cleaned}`;
  }

  if (cleaned.startsWith("marketplace/products/") || cleaned.startsWith("products/")) {
    return `${origin}/storage/${cleaned}`;
  }

  if (raw.startsWith("/storage/")) {
    return `${origin}${raw}`;
  }

  if (raw.startsWith("/")) {
    return raw;
  }

  return `${origin}/storage/${cleaned}`;
}

export function getProductImage(productOrPath) {
  if (typeof productOrPath === "string") {
    return normalizeProductImagePath(productOrPath);
  }

  const product = productOrPath || {};
  return normalizeProductImagePath(
    product.image_url ||
    product.image_path ||
    product.image ||
    product.main_image ||
    product.thumbnail_url ||
    product.product_image_url ||
    product.product?.image_url ||
    product.product?.image_path
  );
}

export function handleProductImageError(event) {
  if (!event?.currentTarget) return;
  if (event.currentTarget.src.endsWith(PRODUCT_IMAGE_PLACEHOLDER)) return;
  event.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER;
}
