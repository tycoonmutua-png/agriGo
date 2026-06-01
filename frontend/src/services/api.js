import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://agrigo-backend-ibus.onrender.com"
});

// ── Attach token to every request ──
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Handle responses — force logout if suspended/rejected ──
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "";
    const isAuthRoute = error.config?.url?.includes("/auth/");

    // Don't intercept auth routes — let login page show the error itself
    if (!isAuthRoute && error.response?.status === 403) {
      const isSuspended =
        message.toLowerCase().includes("suspended") ||
        message.toLowerCase().includes("rejected");

      if (isSuspended) {
        sessionStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;