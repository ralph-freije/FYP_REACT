import api from "./axios";

export const getHomeSummary = () => api.get("/public/home-summary");
export const getHomePreview = () => api.get("/public/home-preview");
export const getHomeProducts = () => api.get("/public/home-products");
export const getHomeCommunities = () => api.get("/public/home-communities");
