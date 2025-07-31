// src/screens/ReadingPage.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API from '../services/API';
import BookCard from '../components/BookCard';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  book: Book;
  lastPage: number;
  user: User;
}
interface User {
  id: string;
}
interface Book {
  id: string;
  name: string;
  author: string;
  coverUrl?: string;
  description?: string;
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
        console.error('Không thể tải sách yêu thích.');
      }
    };

    fetchReading();
    fetchFavorites();
  }, [userId]);

  const handleRead = (bookId: string) => {
    navigate(`/read/${bookId}`);
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
      console.error('Lỗi khi thay đổi yêu thích');
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

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8">
      <h2 className="text-2xl font-semibold mb-6">Sách đang đọc</h2>

      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : readingBooks.length === 0 ? (
        <p>Bạn chưa đọc cuốn sách nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
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