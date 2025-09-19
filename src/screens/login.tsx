import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/API";
import axios from "axios";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  // login states
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();

  // reset về login khi mở modal
  useEffect(() => {
    if (isOpen) {
      setMode("login");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const res = await axios.post(
        API.login,
        { email: emailOrUsername, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data) {
        const data = res.data;
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("username", data.userName);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("role", data.role);

        onClose();
        navigate(-1);
      } else {
        const errData = res.data;
        if (res.status === 429) {
          setErrorMessage(errData.message || "Bạn đã nhập sai quá nhiều lần.");
          const match = errData.message?.match(/(\d+)s/);
          if (match) {
            const seconds = parseInt(match[1], 10);
            setCooldown(seconds);
            const interval = setInterval(() => {
              setCooldown((prev) => {
                if (prev <= 1) {
                  clearInterval(interval);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }
        } else {
          setErrorMessage(errData.message || "Sai tên đăng nhập hoặc mật khẩu");
        }
      }
    } catch (error) {
      setErrorMessage("Lỗi kết nối server, vui lòng thử lại sau.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[99999]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal container */}
      <div className="w-full max-w-md rounded-lg shadow-lg p-8 relative text-white bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-white hover:text-gray-300"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Login */}
        {mode === "login" && (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Email hoặc Username"
                className="w-full px-4 py-2 border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                className="w-full px-4 py-2 border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {errorMessage && (
                <p className="text-red-200 text-sm">
                  {errorMessage}
                  {cooldown > 0 && ` (${cooldown}s)`}
                </p>
              )}

              <button
                type="submit"
                className={`w-full py-2 rounded-md transition ${
                  cooldown > 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-white text-blue-700 font-semibold hover:bg-gray-100"
                }`}
                disabled={cooldown > 0}
              >
                Đăng nhập
              </button>
            </form>

            <div className="flex justify-between mt-4 text-sm">
              <button
                onClick={() => setMode("forgot")}
                className="hover:underline text-white"
              >
                Quên mật khẩu?
              </button>
              <button
                onClick={() => setMode("signup")}
                className="hover:underline text-yellow-200"
              >
                Đăng ký ngay
              </button>
            </div>
          </>
        )}

        {/* Signup */}
        {mode === "signup" && (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Đăng ký</h2>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Tên đầy đủ"
                className="w-full border p-2 rounded text-black"
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full border p-2 rounded text-black"
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                className="w-full border p-2 rounded text-black"
              />
              <button
                type="submit"
                className="w-full bg-white text-green-700 font-semibold py-2 rounded hover:bg-gray-100"
              >
                Đăng ký
              </button>
            </form>
            <p className="mt-4 text-center text-sm">
              Đã có tài khoản?{" "}
              <button
                onClick={() => setMode("login")}
                className="hover:underline text-yellow-200"
              >
                Đăng nhập
              </button>
            </p>
          </>
        )}

        {/* Forgot password */}
        {mode === "forgot" && (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">
              Quên mật khẩu
            </h2>
            <form className="space-y-4">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="w-full border p-2 rounded text-black"
              />
              <button
                type="submit"
                className="w-full bg-white text-yellow-700 font-semibold py-2 rounded hover:bg-gray-100"
              >
                Gửi link đặt lại mật khẩu
              </button>
            </form>
            <p className="mt-4 text-center text-sm">
              Nhớ mật khẩu?{" "}
              <button
                onClick={() => setMode("login")}
                className="hover:underline text-yellow-200"
              >
                Đăng nhập
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
