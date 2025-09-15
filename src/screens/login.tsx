import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/API';

const LoginPage: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const res = await fetch(API.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailOrUsername,
          password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('username', data.userName);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('role', data.role);

        navigate(-1);
      } else {
        const errData = await res.json();

        if (res.status === 429) {
          setErrorMessage(errData.message || 'Bạn đã nhập sai quá nhiều lần.');
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
          setErrorMessage(errData.message || 'Sai tên đăng nhập hoặc mật khẩu');
        }
      }
    } catch (error) {
      setErrorMessage('Lỗi kết nối server, vui lòng thử lại sau.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Email hoặc Username"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {errorMessage && (
            <p className="text-red-500 text-sm">
              {errorMessage}
              {cooldown > 0 && ` (${cooldown}s)`}
            </p>
          )}

          <button
            type="submit"
            className={`w-full py-2 rounded-md transition ${
              cooldown > 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={cooldown > 0}
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
