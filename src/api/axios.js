import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    Accept: "application/json",
  },
});

// Attach Sanctum token to authenticated API calls.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// When a backend token is expired/invalid, send the user to login but remember
// the page they were trying to access. This is especially useful after
// `php artisan migrate:fresh --seed`, because old browser tokens no longer exist
// in the refreshed database.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      const isLoginPage = window.location.pathname === "/login";

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("ecotrack_sidebar_user");

      if (!isLoginPage) {
        sessionStorage.setItem("ecotrack_login_redirect", currentPath);
        window.location.href = `/login?expired=1&redirect=${encodeURIComponent(currentPath)}`;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
