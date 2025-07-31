// src/pages/FavoritesPage.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API from '../services/API';
import BookCard from '../components/BookCard';
import { Link } from 'react-router-dom';
import Loading from '../components/Loading';
import type { Book } from '../types/Book';


const FavoritesPage: React.FC = () => {
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userId = localStorage.getItem('userId')
  useEffect(() => {
  const fetchFavorites = async () => {
    if (!userId) return;

    try {
      const res = await axios.get(API.favorites, {
        headers: { "x-user-id": userId },
      });
      setFavoriteBooks(res.data);
    } catch (err) {
      setError('Không thể tải danh sách yêu thích.');
    } finally {
      setLoading(false);
    }
  };

  fetchFavorites();
}, [userId]);

 const handleRead = (book: Book) => {
  window.location.href = `/reader/${book.id}`;
};
const handleToggleFavorite = async (bookId: string) => {
  try {
    await axios.post(
      API.favorites, // toggle favorite
      { bookId },
      {
        headers: { 'x-user-id': userId },
      }
    );

    const res = await axios.get(API.favorites, {
      headers: { 'x-user-id': userId },
    });

    const updatedBooks = res.data;

    setFavoriteBooks(updatedBooks); 
  } catch (err) {
    console.error(err);
  }
};
if (!userId) {
  return (
    <div className="p-6 text-center text-lg text-gray-700">
      Vui lòng{' '}
      <Link to="/login" className="text-blue-600 font-semibold hover:underline">
        đăng nhập
      </Link>{' '}
      để sử dụng tính năng yêu thích.
    </div>
  );
}
if (loading) return <Loading />;

  return (
  <div className="p-6 font-sans max-w-7xl mx-auto">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-gray-800">Kệ sách yêu thích của bạn</h1>
    </div>


    {loading && (
      <p className="text-center text-gray-500 italic">Đang tải sách yêu thích...</p>
    )}
    {error && <p className="text-center text-red-500">{error}</p>}
    {!loading && favoriteBooks.length === 0 && (
      <p className="text-center text-gray-500 italic">
        Bạn chưa có sách yêu thích nào. Hãy thêm vài quyển nhé!
      </p>
    )}

    <section>
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Danh sách yêu thích</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {Array.isArray(favoriteBooks) &&
          favoriteBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onRead={handleRead}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={true}
            />
          ))}
      </div>
    </section>
  </div>
);

};

export default FavoritesPage;
