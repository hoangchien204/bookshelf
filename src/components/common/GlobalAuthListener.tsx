// src/components/common/AuthWatcher.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../user/AuthContext";

const protectedPrefixes = [
  "/profile",
  "/favorites",
  "/reading",
  "/admin",
  "/read",
];

export default function AuthWatcher() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const needAuth = protectedPrefixes.some((p) =>
      location.pathname.startsWith(p)
    );

    if (!user && needAuth) {
      navigate("/", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  return null;
}
