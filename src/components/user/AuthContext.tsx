import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../types/api";
import API from "../../services/APIURL";

interface AuthContextType {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  logout: (auto?: boolean) => Promise<void>; // Logout nên là async
  openLoginModal: boolean;
  setOpenLoginModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Load user từ LocalStorage (chỉ để lấy UI tạm thời, source of truth là API)
  const [user, setUser] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [openLoginModal, setOpenLoginModal] = useState(false);

  // --- 1. SỬA HÀM LOGOUT ---
  const logout = async (auto = false) => {
    localStorage.setItem("isLoggingOut", "true");
    try {
      await api.post(API.logout);
    } catch (error) {
      console.error("Lỗi khi gọi logout API", error);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      if (auto) {
        toast.error("Đã đăng xuất");
        setOpenLoginModal(true);
      } else {
        toast.success("Đăng xuất thành công!");
        window.location.replace("/");
      }
    }
  };

  useEffect(() => {
    const handleForceLogout = () => {
      logout(true); // Gọi logout với tham số auto=true
    };
    window.addEventListener("auth:logout", handleForceLogout);
    return () => {
      window.removeEventListener("auth:logout", handleForceLogout);
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get(API.ME);
        const userData = res.data.user || res.data;

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (error) {
        localStorage.removeItem("user");
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, logout, openLoginModal, setOpenLoginModal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong AuthProvider");
  }
  return context;
};