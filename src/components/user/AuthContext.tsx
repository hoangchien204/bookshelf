// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

interface AuthContextType {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  logout: (auto?: boolean) => void;
  openLoginModal: boolean;
  setOpenLoginModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem("user") || "null"));
  const [openLoginModal, setOpenLoginModal] = useState(false);

  const logout = (auto = false) => {
    localStorage.clear();
    setUser(null);

    if (auto) {
      toast.error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại!");
      setOpenLoginModal(true);
    } else {
      toast.success("Đăng xuất thành công!");
    }
  };

  useEffect(() => {
    if (!user && localStorage.getItem("accessToken")) {
      setUser(JSON.parse(localStorage.getItem("user")!));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, logout, openLoginModal, setOpenLoginModal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext)!;
