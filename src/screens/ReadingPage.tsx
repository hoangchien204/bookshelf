// src/screens/ReadingPage.tsx
import React, { useEffect, useState } from 'react';
import api from '../types/api';
import API from '../services/APIURL';
import BookCard from '../components/book/BookCard';
import Loading from '../components/common/Loading';
import type { Book } from '../types/Book';
import { useFavorites } from '../hooks/useFavorites';
import LoginModal from './login';
interface Activity {
  id: string;
  book: Book;
  lastPage: number;
  user: User;
}
interface User {
  id: string;
}

const ReadingPage: React.FC = () => {
  const [readingBooks, setReadingBooks] = useState<Book[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');
  const accessToken = localStorage.getItem("accessToken");
  const [showLogin, setShowLogin] = useState(false)
  const { favorites, setFavorites, handleToggleFavorite } = useFavorites(userId, accessToken);

  useEffect(() => {
    const fetchReading = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get(`${API.activities}/user/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const filtered = res.data
          .map((activity: Activity) => activity.book) 
          .slice(0, 10);
        setReadingBooks(filtered);
      } catch (err) {
        setError('Không thể tải danh sách đang đọc.');
      } finally {
        setLoading(false);
      }
    };

    const fetchFavorites = async () => {
      try {
        const res = await api.get(API.favorites, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`

          },
        });
        setFavorites(res.data);
      } catch (err) {

      }
    };

    fetchReading();
    fetchFavorites();
  }, [userId]);

  const handleRead = (book: Book) => {
    window.location.href = `/reader/${book.id}`;
  };



  if (!userId) {
    return (
      <div className="text-center text-white text-lg mt-32">
        Vui lòng{" "}
        <button
          onClick={() => setShowLogin(true)}
          className="text-blue-600 font-semibold hover:underline"
        >
          đăng nhập
        </button>{" "}
        để sử dụng tính năng này.
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
        />
      </div>
    );
  }

  if (loading) return <Loading />;

  return (
    <div
      className="w-full min-h-screen bg-black text-white font-sans 
               px-2 sm:px-4 md:px-6 lg:px-8 py-6 pt-32 sm:pt-20"
    >
      <h1 className="text-3xl font-semibold mb-6">Sách đang đọc</h1>
      {loading && (
        <p className="text-center text-gray-400 italic">Đang tải...</p>
      )}

      {error && <p className="text-center text-red-400">{error}</p>}

      {/* Chưa có sách */}
      {!loading && readingBooks.length === 0 && (
        <p className="text-center text-gray-400 italic">
          Bạn chưa đọc cuốn sách nào.
        </p>
      )}
      {readingBooks.length > 0 && (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 
                   gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 
                   md:gap-x-10 md:gap-y-10 
                   xl:gap-x-[100px] xl:gap-y-12"
        >
          {readingBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onRead={handleRead}
              onToggleFavorite={() => handleToggleFavorite(book)}
              isFavorite={favorites.some((f) => f.id === book.id)}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default ReadingPage;