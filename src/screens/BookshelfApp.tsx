import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaAngleDoubleDown } from "react-icons/fa";
import BookCard from '../components/book/BookCard';
import RecentBanner from '../components/common/banner';
import Loading from '../components/common/Loading';
import { useFavorites } from '../hooks/useFavorites';
import API from '../services/APIURL';
import api from '../types/api';
import type { Book } from '../types/Book';
import { useAuth } from '../components/user/AuthContext';

// Hàm tạo slug cho URL
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

const BookshelfApp: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [bannerData, setBannerData] = useState<Book[]>([]);
  const [bannerType, setBannerType] = useState<'hot' | 'new'>('new'); // State để quản lý loại banner
  
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const userId = user?.id; 
  const { favorites, setFavorites, handleToggleFavorite } = useFavorites(userId); 

  // 1. Fetch Favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userId) return; 
      try {
        const res = await api.get(API.favorites);
        if (Array.isArray(res.data)) {
          setFavorites(res.data);
        }
      } catch (error) {
        console.error("Lỗi fetch favorites:", error);
      }
    };
    fetchFavorites();
  }, [location, userId, setFavorites]);

  // 2. Fetch Books & Xử lý Logic Banner
  useEffect(() => {
    const fetchBooksAndBanner = async () => {
      try {
        setLoadingBooks(true);
        // a. Lấy tất cả sách
        const res = await api.get(API.books);
        const allBooks = res.data;
        setBooks(allBooks);

        // b. Tính toán sách MỚI (trong 30 ngày gần đây)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(new Date().getDate() - 30);
        
        const recentBooks = allBooks.filter((book: Book) => {
          const createdDate = new Date(book.createdAt);
          return createdDate >= thirtyDaysAgo;
        });

        // c. Logic chọn Banner
        if (recentBooks.length >= 5) {
          // Nếu đủ 5 sách mới -> Dùng Banner Sách Mới
          setBannerData(recentBooks);
          setBannerType('new');
        } else {
          // Nếu KHÔNG đủ 5 sách mới -> Gọi API Hot -> Dùng Banner Sách Hot
          try {
            const resHot = await api.get(API.hot); // Giả sử API.hot đã được định nghĩa
            const hotBooks = resHot.data.slice(0, 7); // Lấy top 7
            setBannerData(hotBooks);
            setBannerType('hot');
          } catch (hotErr) {
            console.error("Lỗi fetch hot books, fallback về recent books dù ít:", hotErr);
            setBannerData(recentBooks); // Fallback nếu API hot lỗi
            setBannerType('new');
          }
        }

      } catch (err) {
        console.error("Lỗi fetch books:", err);
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchBooksAndBanner();
  }, []);

  // 3. Danh sách hiển thị ở lưới bên dưới (Grid)
  const displayedBooks = useMemo(() => {
    return books
      .filter((book) => !book.isSeries || book.volumeNumber === 1)
      .slice(0, visibleCount);
  }, [books, visibleCount]);

  // 4. Xử lý Đọc sách

  const handleRead = async (book: Book) => {
  const slug = generateSlug(book.name);

  // 👀 GUEST MODE
  if (!user) {
    navigate(`/book/${slug}-${book.id}`, {
      state: { startPage: 1, isGuest: true },
    });
    return;
  }

  // 👤 USER MODE
  try {
    const res = await api.get(`${API.read}/${book.id}`);
    const lastPage = res.data.page || 1;

    navigate(`/book/${slug}-${book.id}`, {
      state: { startPage: lastPage, isGuest: false },
    });
  } catch (err) {
    console.error(err);
  }
};

  

  return (
    <>
      {loadingBooks ? (
        <Loading />
      ) : (
        <div className="w-full min-h-screen bg-black text-white font-sans px-2 sm:px-4 md:px-6 lg:px-8 py-6 pt-32 sm:pt-20">
          
          <section>
            {/* Hiển thị Banner động dựa trên logic */}
            {bannerData.length > 0 && (
              <RecentBanner
                books={bannerData}
                onRead={handleRead}
                onToggleFavorite={handleToggleFavorite}
                favorites={favorites}
                label={bannerType === 'hot' ? "Sách Hot - Đọc Nhiều Nhất" : "Sách Mới Cập Nhật"}
                iconType={bannerType}
              />
            )}

            <div className="flex justify-between items-center mb-6 mt-12 border-t border-gray-800 pt-8">
              <h1 className="text-2xl font-bold text-white">Kho sách</h1>
            </div>

            {books.length === 0 ? (
              <p className="text-center text-gray-400 mt-10">
                Chưa có sách nào trong thư viện...
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 
                                gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 md:gap-x-10 md:gap-y-7 
                                xl:gap-x-[55px] xl:gap-y-12">
                  {displayedBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onRead={handleRead}
                      onToggleFavorite={() => handleToggleFavorite(book)}
                      isFavorite={favorites.some((f) => f.id === book.id)}
                    />
                  ))}
                </div>

                {/* Nút xem thêm */}
                {visibleCount < books.length && (
                  <div className="text-center mt-12 mb-10">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 10)}
                      className="group px-6 py-3 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full transition-all duration-300 shadow-lg border border-gray-700"
                    >
                      <FaAngleDoubleDown className="group-hover:translate-y-1 transition-transform duration-300" size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
};

export default BookshelfApp;