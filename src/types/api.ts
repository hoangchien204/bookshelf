import axios from "axios";
import API from "../services/APIURL";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: API.local,
});

let isAlreadyHandled401 = false;

// 📌 Interceptor Request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 📌 Interceptor Response
api.interceptors.response.use(
  (res) => {
    return res;
  },
  async (error) => {
    const originalRequest = error.config;
    const currentToken = localStorage.getItem("accessToken");

    if (!currentToken) {
      if (!isAlreadyHandled401) {
        isAlreadyHandled401 = true;
        toast.error("Bạn chưa đăng nhập");
      }
      return Promise.reject(error);
    }

    if (originalRequest.url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    // 🌀 Gặp lỗi 401 → tiến hành refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        localStorage.clear();
        toast.error("Hết phiên đăng nhập, vui lòng đăng nhập lại");
        return Promise.reject(error);
      }

      try {
        const res = await api.post(API.refresh, { refreshToken });

        if (res.data?.accessToken && res.data?.refreshToken) {

          localStorage.setItem("accessToken", res.data.accessToken);
          localStorage.setItem("refreshToken", res.data.refreshToken);

          originalRequest.headers["Authorization"] = `Bearer ${res.data.accessToken}`;
          isAlreadyHandled401 = false;

          const retryResponse = await api(originalRequest);
          return retryResponse;
        } else {
          throw new Error("Refresh token không hợp lệ");
        }
      } catch (err) {
        if (!isAlreadyHandled401) {
          isAlreadyHandled401 = true;
          localStorage.clear();
          toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
