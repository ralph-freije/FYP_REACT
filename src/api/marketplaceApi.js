import api from "./axios";

export const getMarketplaceProducts = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((item) => query.append(`${key}[]`, item));
      return;
    }
    if (value !== undefined && value !== null && value !== "") query.append(key, value);
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return api.get(`/marketplace/products${suffix}`);
};

export const getMarketplaceProduct = (slug) => api.get(`/marketplace/products/${slug}`);

export const getMarketplaceStore = (slug) => api.get(`/marketplace/stores/${slug}`);

export const contactMarketplaceStore = (slug) => api.post(`/auth/marketplace/stores/${slug}/contact`);

export const addProductToCart = (productId, quantity = 1) => api.post("/auth/marketplace/cart/items", {
  product_id: productId,
  quantity,
});

export const submitProductReview = (productId, payload) => api.post(`/auth/marketplace/products/${productId}/reviews`, payload);


export const getCart = () => api.get("/auth/marketplace/cart");

export const updateCartItem = (itemId, quantity) => api.put(`/auth/marketplace/cart/items/${itemId}`, { quantity });

export const removeCartItem = (itemId) => api.delete(`/auth/marketplace/cart/items/${itemId}`);

export const createCardCheckout = (payload) => api.post("/auth/marketplace/checkout/card", payload);

export const getOrderSuccess = (orderId) => api.get(`/auth/marketplace/orders/${orderId}/success`);

export const getOrderFailure = (orderId) => api.get(`/auth/marketplace/orders/${orderId}/failed`);

export const getOrders = () => api.get("/auth/marketplace/orders");

export const getSellerApplication = () => api.get("/auth/marketplace/seller-application");

export const submitSellerApplication = (payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(`${key}[]`, item));
      return;
    }

    formData.append(key, value);
  });

  // Do not set Content-Type manually. The browser/axios must add the
  // multipart boundary, otherwise Laravel may receive an empty file upload.
  return api.post("/auth/marketplace/seller-application", formData);
};


export const getSellerDashboard = () => api.get("/auth/marketplace/seller/dashboard");

export const getSellerStoreSettings = () => api.get("/auth/marketplace/seller/store-settings");

export const updateSellerStoreSettings = (payload) => api.post("/auth/marketplace/seller/store-settings", payload);

export const updateSellerStoreAvailability = (status) => api.patch("/auth/marketplace/seller/store-settings/status", { status });


export const getSellerProducts = () => api.get("/auth/marketplace/seller/products");

export const getSellerProduct = (productId) => api.get(`/auth/marketplace/seller/products/${productId}`);

export const analyzeSellerProductImpact = (payload) => api.post("/auth/marketplace/seller/products/analyze-impact", payload);

export const createSellerProduct = (payload) => api.post("/auth/marketplace/seller/products", payload);

export const updateSellerProduct = (productId, payload) => api.post(`/auth/marketplace/seller/products/${productId}/update`, payload);

export const deleteSellerProduct = (productId) => api.delete(`/auth/marketplace/seller/products/${productId}`);

export const getSellerOrders = () => api.get("/auth/marketplace/seller/orders");

export const updateSellerOrderStatus = (orderItemId, status) => api.patch(`/auth/marketplace/seller/orders/${orderItemId}/status`, { status });

export const messageSellerOrderBuyer = (orderItemId) => api.post(`/auth/marketplace/seller/orders/${orderItemId}/message-buyer`);

export const getAdminSellerApplications = () => api.get("/auth/admin/seller-applications");

export const approveSellerApplication = (applicationId) => api.post(`/auth/admin/seller-applications/${applicationId}/approve`);

export const rejectSellerApplication = (applicationId, payload = {}) => api.post(`/auth/admin/seller-applications/${applicationId}/reject`, payload);

export const getAdminStores = () => api.get("/auth/admin/stores");

export const updateAdminStore = (storeId, payload) => api.put(`/auth/admin/stores/${storeId}`, payload);

export const getAdminMarketplaceProducts = () => api.get("/auth/admin/marketplace-products");

export const updateAdminMarketplaceProduct = (productId, payload) => api.put(`/auth/admin/marketplace-products/${productId}`, payload);
