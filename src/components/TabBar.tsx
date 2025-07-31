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
    <div className="sticky top-0 bg-white shadow z-50">
      {/* Chào mừng user */}
      {isLoggedIn && username && (
        <div className="flex justify-end px-4 pt-2 pb-1 text-sm text-gray-500 italic border-b border-gray-200">
          Chào mừng, <span className="ml-1 font-semibold text-blue-600">{username}</span>!
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex justify-around items-center h-12 border-b border-gray-200">
        <Link to="/" className={tabClass(pathname === '/')}>
          <FontAwesomeIcon icon={faHome} />
          <span>Trang chủ</span>
        </Link>

        <Link to="/favorites" className={tabClass(pathname === '/favorites')}>
          <FontAwesomeIcon icon={faHeart} />
          <span>Yêu thích</span>
        </Link>

        <Link to="/reading" className={tabClass(pathname === '/reading')}>
          <FontAwesomeIcon icon={faBookOpen} />
          <span>Đang đọc</span>
        </Link>

        {isLoggedIn ? (
          <>
            <button onClick={() => setShowModal(true)} className={tabClass(false)}>
              <FontAwesomeIcon icon={faRightToBracket} />
              <span>Đăng xuất</span>
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
          <Link to="/login" className={tabClass(pathname === '/login')}>
            <FontAwesomeIcon icon={faUser} />
            <span>Đăng nhập</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default TabBar;
