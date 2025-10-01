// src/screens/BookManagement.tsx
import { useEffect, useState } from 'react';
import api from '../../types/api';
import { FaPlus, FaSearch } from 'react-icons/fa';
import AddBookModal from '../components/AddBookModal';
import EditBookModal from '../components/EditBookModal';
import API from '../../services/APIURL';
import type { BookData } from '../../types/BookData';
import type { Book } from '../../types/Book';

interface Genre {
  id: string;
  name: string;
}

const BookManagement = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [bookData, setBookData] = useState<BookData>({
    name: '',
    author: '',
    genre: null,
    description: '',
    file: null,
    cover: null,
  });
  const token = localStorage.getItem('accessToken')
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const bookPage = 15;


  // const booksPerPage = 5;
  useEffect(() => {
    api
      .get(API.genres)
      .then((res) => setGenres(res.data))
      .catch((err) => console.error('Lỗi khi lấy genres:', err));
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await api.get(API.books, { headers: { Authorization: `Bearer ${token}`, } });
      setBooks(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleEditClick = (book: Book) => {
    setEditingBook(book);
  };

  // Xử lý lưu sách (thêm hoặc sửa)
  const handleSaveBook = async (newBookData: BookData) => {
    try {
      const formData = new FormData();
      formData.append('name', newBookData.name);
      formData.append('author', newBookData.author);
      formData.append('description', newBookData.description);

      // 👇 gửi đúng genreId
      if (!newBookData.genre?.id) {
        throw new Error('Thể loại không hợp lệ');
      }
      formData.append('genreId', newBookData.genre?.id);

      if (newBookData.file) {
        formData.append('bookFile', newBookData.file);
      }
      if (newBookData.cover) {
        formData.append('cover', newBookData.cover);
      }

      if (editingBook) {
        await api.put(`${API.books}/${editingBook.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}`, },
        });
        setEditingBook(null);
      } else {
        await api.post(API.books, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}`, },
        });
      }

      setShowAddModal(false);
      fetchBooks();
    } catch (error) {
      console.error(error);
    }
  };

  // Xóa sách
  const deleteBook = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sách này?')) {
      try {
        await api.delete(`${API.books}/${id}`, { headers: { Authorization: `Bearer ${token}`, } });
        setBooks(books.filter((b) => b.id !== id));
        setShowDeleteSuccessModal(true);
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Lọc sách theo tên tìm kiếm
  const filteredBooks = books.filter((book) =>
    book.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBooks.length / bookPage);
  const startIndex = (currentPage - 1) * bookPage;
  const currentBooks = filteredBooks.slice(startIndex, startIndex + bookPage);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Quản lý sách</h1>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center border rounded px-2 py-1">
          <FaSearch className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Tìm theo tên sách..."
            className="outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowAddModal(true)}
        >
          <FaPlus />
          Thêm sách
        </button>
      </div>

      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">ID</th>
            <th className="border p-2 text-left">Tên sách</th>
            <th className="border p-2 text-left">Tác giả</th>
            <th className="border p-2 text-left">Thể loại</th>
            <th className="border p-2 text-left">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {currentBooks.length > 0 ? (
            currentBooks.map((book) => (
              <tr key={book.id}>
                <td className="border p-2">{book.id}</td>
                <td className="border p-2">{book.name}</td>
                <td className="border p-2">{book.author}</td>
                <td className="border p-2">
                  {book.genres && book.genres.length > 0
                    ? book.genres.map((g) => g.name).join(', ')
                    : genres.find((g) => g.id === book.genreId)?.name || 'Không xác định'}
                </td>
                <td className="border p-2 text-center space-x-2">
                  <button
                    onClick={() => handleEditClick(book)}
                    className="text-blue-600 hover:underline"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => deleteBook(book.id)}
                    className="text-red-600 hover:underline"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="border p-2 text-center text-gray-500">
                Không tìm thấy sách nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="w-10 h-10 rounded-full bg-gray-200  disabled:opacity-50"
        >←
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded-full ${currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="w-10 h-10 rounded-full bg-gray-200  disabled:opacity-50"
        >→
        </button>
      </div>

      {/* Modal Thêm sách */}
      {showAddModal && (
        <AddBookModal
          show={showAddModal}
          bookData={bookData}
          setBookData={setBookData}
          onSave={handleSaveBook}
          onCancel={() => setShowAddModal(false)}
          genreOptions={genres.map((g) => ({ label: g.name, value: g.id }))}
        />
      )}

      {/* Modal Sửa sách */}
      {editingBook && (
        <EditBookModal
          bookId={editingBook.id}
          currentGenreIds={
            editingBook.genres
              ? editingBook.genres.map((g) => g.id)
              : editingBook.genreId
                ? [editingBook.genreId]
                : []
          }
          currentDescription={editingBook.description}
          genres={genres}
          onClose={() => setEditingBook(null)}
          onUpdated={fetchBooks}
        />
      )}

      {/* Modal thông báo xóa thành công */}
      {showDeleteSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <p className="text-green-600 text-lg font-semibold">Đã xóa sách thành công!</p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowDeleteSuccessModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookManagement;
