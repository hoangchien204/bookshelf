import { FaHeart, FaRegHeart } from "react-icons/fa";
import { motion } from "framer-motion";
import { slugify } from "../../utils/slug";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { Book } from '../../types/Book';
import { useAuth } from "../user/AuthContext";


interface BookCardProps {
  book: Book;
  onRead: (book: Book) => void | Promise<void>;
  onToggleFavorite: (bookId: string) => void;
  isFavorite: boolean;
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  onToggleFavorite,
  isFavorite,
}) => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleNavigate = () => {
    const slug = slugify(book.name);
    navigate(`/book/${slug}-${book.id}`, {
      state: { book },
    });
  };


  const handleFavoriteClick = () => {
    const { user } = useAuth()
    const userId = user?.id;
    if (!userId) {
      setShowLoginModal(true);
      return;
    }
    onToggleFavorite(book.id);
  };

  return (
    <motion.div
      className="flex flex-col items-center w-[160px] md:w-[180px] lg:w-[200px] text-white"
    >
      {/* Card ảnh */}
      <div
        onClick={handleNavigate}
        className=" w-[150px] h-[220px]    
                    sm:w-[180px] sm:h-[260px]
                    md:w-[208px] md:h-[306px]  bg-white rounded shadow relative group hover:shadow-lg cursor-pointer"
      >
        <img
          src={book.coverUrl}
          alt="cover"
          className="w-full h-full object-cover rounded"
        />
        {/* Icon tim */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFavoriteClick();
          }}
          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition"
        >
          {isFavorite ? (
            <FaHeart className="text-red-500" />
          ) : (
            <FaRegHeart className="text-gray-400" />
          )}
        </button>
      </div>

      <div
        onClick={handleNavigate}
        className="cursor-pointer text-center mt-2 hover:text-[#8b4513] transition"
      >
        <div className="text-sm sm:text-base font-bold leading-snug line-clamp-2">
          {book.name}
        </div>
      </div>

      {/* Modal thông báo đăng nhập */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Thông báo</h2>
            <p className="mb-6 text-gray-700">
              Bạn cần đăng nhập để thực hiện chức năng này.
            </p>
            <div className="flex justify-between">
              <button
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 mr-2"
                onClick={() => {
                  setShowLoginModal(false);
                  navigate("/login");
                }}
              >
                Đăng nhập
              </button>
              <button
                className="flex-1 border border-gray-400 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 ml-2"
                onClick={() => setShowLoginModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BookCard;
