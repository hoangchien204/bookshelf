import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookCard from '../components/book/BookCard';
import API from '../services/APIURL';
import api from '../types/api';
import Loading from '../components/common/Loading';
import type { Book } from '../types/Book';
import { useFavorites } from '../hooks/useFavorites';
import { FaAngleDoubleDown } from "react-icons/fa";
import { useGlobalModal } from '../components/common/GlobalModal';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import RecentBanner from '../components/common/banner';

const BookshelfApp: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const accessToken = localStorage.getItem("accessToken");
  const { favorites, setFavorites, handleToggleFavorite } = useFavorites(userId, accessToken);

  const location = useLocation();
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const { showModal } = useGlobalModal()

  const displayedBooks = books
    .filter((book) => !book.isSeries || book.volumeNumber === 1)
    .slice(0, visibleCount);
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!userId) return;

      try {
        const res = await api.get(API.favorites, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (Array.isArray(res.data)) {
          setFavorites(res.data);
        } else {
          console.warn(res.data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchFavorites();
  }, [location]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await api.get(API.books);
        setBooks(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBooks(false);
      }
    };
    fetchBooks();
  }, []);

  const handleRead = async (book: Book) => {
    try {
      const res = await api.get(`${API.read}/${book.id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const lastPage = res.data.page || 1;

      const slug = book.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      navigate(`/book/${slug}-${book.id}`, { state: { startPage: lastPage } });
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        showModal('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', "error");
      }
    }
  };


  const now = new Date();
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(now.getDate() - 14);

  const recentBooks = books.filter((book) => {
    const createdDate = new Date(book.createdAt);
    return createdDate >= twoWeeksAgo;
  });


  return (
    <>
      {loadingBooks ? (
        <Loading />
      ) : (
        <div className="w-full min-h-screen bg-black text-white font-sans px-2 sm:px-4 md:px-6 lg:px-8 py-6 pt-32 sm:pt-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Kệ sách của bạn</h1>
          </div>

          <section>
            {/* Sách mới nhất */}
            {recentBooks.length > 0 && (
              <RecentBanner
                books={recentBooks}
                onRead={handleRead}
                onToggleFavorite={handleToggleFavorite}
                favorites={favorites}
              />
            )}
            <h1 className="text-xl font-semibold mb-4 text-left">Kho sách</h1>

            {books.length === 0 ? (
              <p className="text-center text-gray-400">
                Người này quá lười để thêm sách
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

                {visibleCount < books.length && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 10)}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-full transition"
                    >
                      <FaAngleDoubleDown />
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
