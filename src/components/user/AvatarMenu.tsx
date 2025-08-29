import { Link } from "react-router-dom";
import { useState, useRef } from "react";

const AvatarMenu = ({ avatarUrl, username }: { avatarUrl?: string; username?: string }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const hideTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleEnter = () => {
        // Huỷ timer ẩn nếu đang chạy
        if (hideTimeout.current) {
            clearTimeout(hideTimeout.current);
            hideTimeout.current = null;
        }
        if (!isVisible) {
            setIsVisible(true);
            setTimeout(() => setIsOpen(true), 10);
        } else {
            setIsOpen(true); 
        }
    };

    const handleLeave = () => {
        hideTimeout.current = setTimeout(() => {
            setIsOpen(false);
            setTimeout(() => setIsVisible(false), 200);
        }, 500);
    };

    return (
        <div
            className="relative flex-1 text-center"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <div className="cursor-pointer">
                <img
                    src={avatarUrl || "/default-avatar.png"}
                    alt={username || "User"}
                    className="w-8 h-8 mx-auto rounded-full border border-gray-500"
                />
                <span className="block text-xs text-gray-300">Bạn</span>
            </div>
            {isVisible && (
                <div
                    className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg border text-left z-50
                    transform transition-all duration-300 ease-out
                    ${isOpen
                    ? "opacity-100 translate-y-0 scale-100 bg-white border-gray-200"
                    : "opacity-0 -translate-y-2 scale-95 bg-white border-gray-200"}
                    `}
                >
                    <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 transition-colors"
                    >
                        Hồ sơ
                    </Link>
                    <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-100 transition-colors"
                    >
                        Cài đặt
                    </Link>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 transition-colors"
                    >
                        Đăng xuất
                    </button>
                </div>
            )}
        </div>
    );
};

export default AvatarMenu;
