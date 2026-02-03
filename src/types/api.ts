import axios from "axios";
import API from "../services/APIURL";

const api = axios.create({
  baseURL: API.local,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // 🔴 1. Không xử lý nếu là refresh
    if (originalRequest?.url?.includes(API.refresh)) {
      return Promise.reject(error);
    }

    // 🔴 2. Không xử lý nếu đang logout hoặc request auth đặc biệt
    const isLogoutRequest =
      originalRequest?.url?.includes("/auth/logout") ||
      originalRequest?.url?.includes("/auth/me");

    if (localStorage.getItem("isLoggingOut") === "true" || isLogoutRequest) {
      return Promise.reject(error);
    }

    // 🔴 3. Guest thì KHÔNG refresh
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      return Promise.reject(error);
    }

    // 🔴 4. Chỉ refresh đúng 1 lần
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await api.post(API.refresh);
        return api(originalRequest);
      } catch (err) {
        // 🔥 refresh fail → logout user
        localStorage.removeItem("user");
        const event = new Event("auth:logout");
        window.dispatchEvent(event);
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);


export default api;