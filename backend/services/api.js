import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://agrigo-backend-ibus.onrender.com",
  timeout: 20000, // 20 seconds max wait
});

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Show friendly error if backend is sleeping
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED" || !error.response) {
      error.message = "Server is waking up, please try again in a moment...";
    }
    return Promise.reject(error);
  }
);

export default API;