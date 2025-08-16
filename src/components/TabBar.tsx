import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faHeart, faBookOpen, faRightToBracket, faUser } from '@fortawesome/free-solid-svg-icons';
import LogoutConfirmModal from '../components/LogoutConfirmModal.tsx';
import { useState } from 'react';

const TabBar = () => {
  const { pathname } = useLocation();
  const isLoggedIn = !!localStorage.getItem('accessToken');
  const username = localStorage.getItem('username');
  const [showModal, setShowModal] = useState(false);

  const tabClass = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2 border-b-2 ${
      active ? 'border-blue-600 text-blue-600 font-semibold' : 'border-transparent text-gray-600'
    } hover:text-blue-600 hover:bg-gray-100 transition`;

return (
  <div className="sticky top-0 bg-white shadow z-50 w-full">
    {/* Chào mừng user */}
    {isLoggedIn && username && (
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex justify-end px-4 sm:px-6 lg:px-8 pt-2 pb-1 text-sm text-gray-500 italic">
          Chào mừng,{" "}
          <span className="ml-1 font-semibold text-blue-600">{username}</span>!
        </div>
      </div>
    )}

    {/* Navigation tabs */}
    <div className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-12 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className={`flex-1 text-center ${tabClass(pathname === "/")}`}
        >
          <FontAwesomeIcon icon={faHome} />
          <span className="block text-xs">Trang chủ</span>
        </Link>

        <Link
          to="/favorites"
          className={`flex-1 text-center ${tabClass(pathname === "/favorites")}`}
        >
          <FontAwesomeIcon icon={faHeart} />
          <span className="block text-xs">Yêu thích</span>
        </Link>

        <Link
          to="/reading"
          className={`flex-1 text-center ${tabClass(pathname === "/reading")}`}
        >
          <FontAwesomeIcon icon={faBookOpen} />
          <span className="block text-xs">Đang đọc</span>
        </Link>

        {isLoggedIn ? (
          <>
            <button
              onClick={() => setShowModal(true)}
              className={`flex-1 text-center ${tabClass(false)}`}
            >
              <FontAwesomeIcon icon={faRightToBracket} />
              <span className="block text-xs">Đăng xuất</span>
            </button>
            {showModal && (
              <LogoutConfirmModal
                onConfirm={() => {
                  localStorage.clear();
                  setShowModal(false);
                }}
                onCancel={() => setShowModal(false)}
              />
            )}
          </>
        ) : (
          <Link
            to="/login"
            className={`flex-1 text-center ${tabClass(pathname === "/login")}`}
          >
            <FontAwesomeIcon icon={faUser} />
            <span className="block text-xs">Đăng nhập</span>
          </Link>
        )}
      </div>
    </div>
  </div>
);
};

export default TabBar;
