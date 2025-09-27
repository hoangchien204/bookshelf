import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/APIURL";
import api from "../types/api";
import axios from "axios";
import { useGlobalModal } from "../components/common/GlobalModal";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "verify" | "reset">("login");
  // login states
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const { showModal } = useGlobalModal()
  const [cooldown, setCooldown] = useState(0);
  // error
  const [errorMessage, setErrorMessage] = useState("");
  // signup states
  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // verify states
  const [, setVerifyEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  // forgot
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const navigate = useNavigate();
  const [verifyPurpose, setVerifyPurpose] = useState<"signup" | "reset">("signup");

  useEffect(() => {
    if (isOpen) {
      setMode("login");
      setErrorMessage("");
    }

    if (!isOpen) {
      setSignupData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    }
    setEmailOrUsername("");
    setPassword("");

    setErrorMessage("");


  }, [isOpen]);

  if (!isOpen) return null;

  // login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const res = await api.post(
        API.login,
        { email: emailOrUsername, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data) {
        const data = res.data;
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("username", data.userName);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("role", data.role);


        onClose();
        navigate("/");
        window.location.reload();
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(error.response.data.message || "Sai tên đăng nhập hoặc mật khẩu");
      } else {
        setErrorMessage("Lỗi kết nối server, vui lòng thử lại sau.");
      }
    }
  };
  //singup
  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (signupData.password !== signupData.confirmPassword) {
      setErrorMessage("Mật khẩu nhập lại không khớp");
      return;
    }
    if(signupData.password.length < 6){
      setErrorMessage("Mât khẩu tối thiểu 6 ký tự")
      return;
    }
    try {
      const res = await api.post(API.verifyEmail, {
        email: signupData.email,
        purpose: "signup",
      });

      if (res.data) {
        showModal("Vui lòng kiểm tra email để lấy mã xác thực.");
        setVerifyEmail(signupData.email);
        setVerifyPurpose("signup");
        setMode("verify");
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data;
        let msg = "Lỗi khi gửi mã xác thực";

        if (typeof data.message === "string") {
          msg = data.message;
        } else if (Array.isArray(data.message)) {
          msg = data.message[0];
        }

        setErrorMessage(msg);
      } else {
        setErrorMessage("Không kết nối được server.");
      }
    }
  };
  //Verify
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      if (verifyPurpose === "signup") {
        const res = await api.post(API.users, {
          username: signupData.username,
          email: signupData.email,
          password: signupData.password,
          code: verifyCode,
        });

        if (res.data) {
          showModal("Đăng ký thành công! Bạn có thể đăng nhập.");
          setMode("login");
        }
      } else if (verifyPurpose === "reset") {
        showModal("Mã xác minh hợp lệ! Hãy đặt lại mật khẩu mới.");
        setMode("reset");
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(error.response.data.message || "Mã xác nhận không hợp lệ");
      } else {
        setErrorMessage("Không kết nối được server.");
      }
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;
    await handleSignup(new Event("submit") as any);
    setCooldown(60);

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Mật khẩu nhập lại không khớp");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    try {
      const res = await api.post(`${API.resetPassword}`, {
        email: forgotEmail,
        code: verifyCode,
        newPassword: newPassword,
      });

      if (res.data) {
        showModal("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập.");
        setMode("login");
        setNewPassword("");
        setConfirmNewPassword("");
        setVerifyCode("");
        setForgotEmail("");
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(error.response.data.message || "Đặt lại mật khẩu thất bại");
      } else {
        setErrorMessage("Lỗi kết nối máy chủ. Vui lòng thử lại.");
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const res = await api.post(API.verifyEmail, {
        email: forgotEmail,
        purpose: "reset",
      });

      if (res.data) {
        showModal("📩 Mã đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email.");
        setVerifyEmail(forgotEmail);
        setVerifyPurpose("reset");
        setMode("verify");
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(error.response.data.message || "Không thể gửi mã đặt lại mật khẩu");
      } else {
        setErrorMessage("Không kết nối được server.");
      }
    }
  };



  return (
    <div className="fixed inset-0 flex items-center justify-center z-[99999]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="w-full max-w-md mx-4 sm:mx-0 rounded-2xl shadow-2xl p-6 sm:p-8 relative text-white 
                bg-gradient-to-br from-gray-900 via-gray-800 to-black animate-fadeIn">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-300 hover:text-white text-xl"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Login */}
        {mode === "login" && (
          <>
            <h2 className="text-2xl font-extrabold text-center mb-6 text-yellow-400">
              Đăng nhập
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Email hoặc Username"
                className="w-full px-3 py-2 border rounded-xl text-black"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                className="w-full px-3 py-2 border rounded-xl text-black"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {errorMessage && (
                <p className="text-red-300 text-sm text-center">{errorMessage}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-semibold bg-yellow-500 text-black hover:opacity-90"
              >
                Đăng nhập
              </button>
            </form>

            <div className="flex justify-between mt-6 text-sm">
              <button
                onClick={() => setMode("forgot")}
                className="hover:underline text-gray-300"
              >
                Quên mật khẩu?
              </button>
              <button
                onClick={() => setMode("signup")}
                className="hover:underline text-yellow-300"
              >
                Đăng ký ngay
              </button>
            </div>
          </>
        )}

        {/* Signup */}
        {mode === "signup" && (
          <>
            <h2 className="text-2xl font-extrabold text-center mb-6 text-green-400">
              Đăng ký
            </h2>
            <form onSubmit={handleSignup} className="space-y-4">
              <input
                type="text"
                name="username"
                placeholder="Tài khoản"
                value={signupData.username}
                onChange={handleSignupChange}
                className="w-full border p-3 rounded-xl text-black"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={signupData.email}
                onChange={handleSignupChange}
                className="w-full border p-3 rounded-xl text-black"
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Mật khẩu"
                value={signupData.password}
                onChange={handleSignupChange}
                className="w-full border p-3 rounded-xl text-black"
                required
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu"
                value={signupData.confirmPassword}
                onChange={handleSignupChange}
                className="w-full border p-3 rounded-xl text-black"
                required
              />

              {errorMessage && (
                <p className="text-red-300 text-sm text-center">{errorMessage}</p>
              )}

              <button
                type="submit"
                className="w-full bg-green-500 text-black font-semibold py-3 rounded-xl hover:opacity-90"
              >
                Đăng ký
              </button>
            </form>
            <p className="text-center text-sm text-gray-300 mt-4">
              Đã có tài khoản?{" "}
              <button
                type="button"
                className="text-green-400 hover:underline"
                onClick={() => setMode("login")}
              >
                Đăng nhập ngay
              </button>
            </p>
          </>
        )}


        {mode === "verify" && (
          <>
            <h2 className="text-2xl font-extrabold text-center mb-6 text-blue-400">
              Nhập mã xác nhận
            </h2>
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="Nhập mã xác nhận từ email"
                className="w-full border p-3 rounded-xl text-black"
                required
              />

              {errorMessage && (
                <p className="text-red-300 text-sm text-center">{errorMessage}</p>
              )}

              <button
                type="submit"
                className="w-full bg-blue-500 text-black font-semibold py-3 rounded-xl hover:opacity-90"
              >
                Xác nhận
              </button>
            </form>

            <p className="mt-6 text-center text-sm">
              Chưa nhận được email?{" "}
              <button
                onClick={handleResendCode} // Gửi lại
                className={`hover:underline ${cooldown > 0 ? "text-gray-400 cursor-not-allowed" : "text-yellow-300"}`}
                disabled={cooldown > 0}
              >
                {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã"}
              </button>
            </p>
          </>
        )}

        {/* Forgot password */}
        {mode === "forgot" && (
          <>
            <h2 className="text-2xl font-extrabold text-center mb-6 text-pink-400">
              Quên mật khẩu
            </h2>
            <form className="space-y-4" onSubmit={handleForgotPassword}>
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="w-full border p-3 rounded-xl text-black"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-pink-500 text-black font-semibold py-3 rounded-xl hover:opacity-90"
              >
                Gửi link đặt lại mật khẩu
              </button>
            </form>
            <p className="mt-6 text-center text-sm">
              Nhớ mật khẩu?{" "}
              <button
                onClick={() => setMode("login")}
                className="hover:underline text-yellow-300"
              >
                Đăng nhập
              </button>
            </p>
          </>
        )}

        {mode === "reset" && (
          <>
            <h2 className="text-2xl font-extrabold text-center mb-6 text-blue-400">
              Đặt lại mật khẩu
            </h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input
                type="password"
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border p-3 rounded-xl text-black"
                required
              />
              <input
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full border p-3 rounded-xl text-black"
                required
              />

              {errorMessage && (
                <p className="text-red-300 text-sm text-center">{errorMessage}</p>
              )}

              <button
                type="submit"
                className="w-full bg-blue-500 text-black font-semibold py-3 rounded-xl hover:opacity-90"
              >
                Xác nhận mật khẩu mới
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

export default LoginModal;
