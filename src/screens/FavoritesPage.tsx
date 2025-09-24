// src/pages/FavoritesPage.tsx
import React, { useEffect, useState } from 'react';
import api from '../types/api';
import API from '../services/APIURL';
import BookCard from '../components/book/BookCard';
import Loading from '../components/common/Loading';
import type { Book } from '../types/Book';
import { useFavorites } from '../hooks/useFavorites';
import LoginModal from './login';


const FavoritesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const accessToken = localStorage.getItem("accessToken")
  const userId = localStorage.getItem('userId')
  const { favorites, setFavorites, handleToggleFavorite } = useFavorites(userId, accessToken);
  const [showLogin, setShowLogin] = useState(false);

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
        setFavorites(res.data);
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
  if (!userId) {
  return (
    <div className="text-center text-lg text-white mt-32">
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kệ sách yêu thích của bạn</h1>
      </div>
      {loading && (
        <p className="text-center text-gray-400 italic">
          Đang tải sách yêu thích...
        </p>
      )}
      {error && <p className="text-center text-red-400">{error}</p>}
      {!loading && favorites.length === 0 && (
        <p className="text-center text-gray-400 italic">
          Bạn chưa có sách yêu thích nào. Hãy thêm vài quyển nhé!
        </p>
      )}
      {favorites.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Danh sách yêu thích</h2>

          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 
                       gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 
                       md:gap-x-10 md:gap-y-10 
                       xl:gap-x-[100px] xl:gap-y-12"
          >
            {Array.isArray(favorites) &&
              favorites.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onRead={handleRead}
                  onToggleFavorite={() => handleToggleFavorite(book)}
                  isFavorite={true}
                />
              ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FavoritesPage;
