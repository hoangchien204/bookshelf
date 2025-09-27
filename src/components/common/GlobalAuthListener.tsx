// src/components/common/AuthWatcher.tsx
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function isTokenExpired() {
  const token = localStorage.getItem("accessToken");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    }
  } catch {
    // ignore
  }
  const loginTime = localStorage.getItem("loginTime");
  if (loginTime) {
    const now = Date.now();
    const expired = parseInt(loginTime, 10) + 3 * 60 * 60 * 1000;
    return now > expired;
  }
  return false;
}

export default function AuthWatcher() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAction = () => {
      if (isTokenExpired()) {
        navigate("/");
      }
    };

    window.addEventListener("click", handleAction);
    window.addEventListener("keydown", handleAction);
    window.addEventListener("scroll", handleAction);

    return () => {
      window.removeEventListener("click", handleAction);
      window.removeEventListener("keydown", handleAction);
      window.removeEventListener("scroll", handleAction);
    };
  }, [navigate]);

  return null;
}
