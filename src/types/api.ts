import axios from "axios";
import API from "../services/APIURL";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: API.local,
});

let isAlreadyHandled401 = false;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(API.refresh, { refreshToken });

        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(originalRequest);
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
