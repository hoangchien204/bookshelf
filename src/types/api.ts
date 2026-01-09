import axios from "axios";
import API from "../services/APIURL";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: API.local,
  withCredentials: true,
});

let isAlreadyHandled401 = false;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;


    const isLogoutRequest =
      originalRequest.url.includes("/auth/logout") ||
      originalRequest.url.includes("/auth/me");

    if (localStorage.getItem("isLoggingOut") === "true" || isLogoutRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await api.post(API.refresh);
        isAlreadyHandled401 = false;
        return api(originalRequest);
      } catch (err) {
        if (!isAlreadyHandled401) {
          isAlreadyHandled401 = true;
          localStorage.removeItem("user");
          const event = new Event("auth:logout");
          window.dispatchEvent(event);
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;