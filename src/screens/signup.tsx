import React from "react";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  if (!isOpen) return null; // 👈 chỉ render khi mở

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999999]">
      <div className="bg-white w-[90%] max-w-md rounded-lg shadow-lg p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center">Đăng ký tài khoản</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            // TODO: call API signup ở đây
            console.log("Sign up form submitted");
          }}
          className="space-y-4"
        >
          <input
            type="text"
            placeholder="Tên đầy đủ"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-300"
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-300"
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring focus:ring-blue-300"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 font-semibold transition"
          >
            Đăng ký
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Đã có tài khoản?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:underline font-medium"
          >
            Đăng nhập ngay
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupModal;
