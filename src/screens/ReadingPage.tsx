// src/screens/ReadingPage.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API from '../services/API';
import BookCard from '../components/book/BookCard';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/common/Loading';
import type { Book } from '../types/Book';
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
  const [favorites, setFavorites] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReading = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(API.activities, {
          headers: { 'x-user-id': userId },
        });

        const filtered = res.data
          .filter((activity: Activity) => activity.user.id === userId && activity.lastPage > 0)
          .map((activity: Activity) => activity.book);
        setReadingBooks(filtered);
      } catch (err) {
        setError('Không thể tải danh sách đang đọc.');
      } finally {
        setLoading(false);
      }
    };

    const fetchFavorites = async () => {
      try {
        const res = await axios.get(API.favorites, {
          headers: { 'x-user-id': userId },
        });
        setFavorites(res.data.map((book: Book) => book.id));
      } catch (err) {

      }
    };

    fetchReading();
    fetchFavorites();
  }, [userId]);

  const handleRead = (book: Book) => {
    window.location.href = `/reader/${book.id}`;
  };

  const handleToggleFavorite = async (bookId: string) => {
    try {
      await axios.post(API.activities, null, {
        headers: { 'x-user-id': userId },
      });
      setFavorites((prev) =>
        prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
      );
    } catch (err) {

    }
  };

  if (!userId) {
    return (
      <div className="text-center mt-20">
        <p className="text-lg">
          Vui lòng{' '}
          <span
            className="text-blue-600 font-semibold cursor-pointer"
            onClick={() => navigate('/login')}
          >
            đăng nhập
          </span>{' '}
          để sử dụng tính năng này.
        </p>
      </div>
    );
  }
  if (loading) return <Loading />;

  return (
    <div
      className="w-full min-h-screen bg-black text-white font-sans 
               px-2 sm:px-4 md:px-6 lg:px-8 py-6"
    >
      {/* Tiêu đề */}
      <h2 className="text-2xl font-semibold mb-6">Sách đang đọc</h2>

      {/* Loading */}
      {loading && (
        <p className="text-center text-gray-400 italic">Đang tải...</p>
      )}

      {/* Error */}
      {error && <p className="text-center text-red-400">{error}</p>}

      {/* Chưa có sách */}
      {!loading && readingBooks.length === 0 && (
        <p className="text-center text-gray-400 italic">
          Bạn chưa đọc cuốn sách nào.
        </p>
      )}

      {/* Danh sách sách đang đọc */}
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
              onToggleFavorite={handleToggleFavorite}
              isFavorite={favorites.includes(book.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadingPage;