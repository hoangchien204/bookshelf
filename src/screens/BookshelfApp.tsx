import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookCard from '../components/BookCard';
import API from '../services/API';
import axios from 'axios';
import Loading from '../components/Loading';
import type { Book } from '../types/Book';
import toast from 'react-hot-toast';


const BookshelfApp: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const location = useLocation();
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [processingBookId, setProcessingBookId] = useState<string | null>(null);

  useEffect(() => {
  const fetchFavorites = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      const res = await axios.get(API.favorites, {
        headers: { "x-user-id": userId },
      });

      if (Array.isArray(res.data)) {
        const favoriteIds = res.data.map((book: any) => book.id);
        setFavorites(favoriteIds);
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
        const res = await axios.get(API.books, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        setBooks(res.data);
      } catch (err) {
        console.error(err);
      }finally {
        setLoadingBooks(false); 
      }
    };
    fetchBooks();
  }, []);

const handleToggleFavorite = async (bookId: string) => {
  if (!userId || processingBookId === bookId) return; // đang xử lý thì bỏ qua

  setProcessingBookId(bookId);

  setFavorites(prev =>
    prev.includes(bookId)
      ? prev.filter(id => id !== bookId)
      : [...prev, bookId]
  );

  try {
    const response = await axios.post(
      API.favorites,
      { bookId },
      { headers: { 'x-user-id': userId } }
    );

    if (typeof response.data.isFavorite !== "undefined") {
      setFavorites(prev =>
        response.data.isFavorite
          ? [...new Set([...prev, bookId])]
          : prev.filter(id => id !== bookId)
      );
      
    }
    if (response.data.isFavorite) {
    toast.success("Yêu thích thành công");
  } else {
    toast.success("Bỏ yêu thích thành công"); // hoặc đổi màu/icon tùy bạn
  }
  } catch (error) {
    console.error(error);
    setFavorites(prev =>
      prev.includes(bookId)
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
    );
  } finally {
    setTimeout(() => setProcessingBookId(null), 500);
  }
};

  const handleRead = async (book: Book) => {
    try {
      const res = await axios.get(`${API.read}/${book.id}`, {
        headers: {
          'x-user-id': userId
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
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
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
   if (loadingBooks) return <Loading />;

  return (
  <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-6 font-sans">
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-3xl font-bold text-gray-800">Kệ sách của bạn</h1>
  </div>

  <section>
    <h2 className="text-xl font-semibold mb-4 text-gray-700">Kho sách</h2>

    {books.length === 0 ? (
      <p className="text-center text-gray-500">Người này quá lười để thêm sách</p>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 md:gap-x-10 md:gap-y-10 xl:gap-x-[100px] xl:gap-y-12">
      {books
  .filter(book => !book.isSeries || book.volumeNumber === 1)
  .map(book => (
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

    {recentBooks.length > 0 && (
  <section className="mb-10">
   <h2 className="text-xl font-semibold mb-4 text-gray-700 mt-10">Sách mới cập nhật</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 md:gap-x-10 md:gap-y-10 xl:gap-x-[100px] xl:gap-y-12">
      {recentBooks.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onRead={handleRead}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={favorites.includes(book.id)}
        />
      ))}
    </div>
  </section>
)}

    
  </section>
</div>
);
};

export default BookshelfApp;
