// src/screens/BookManagement.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaPlus, FaSearch } from 'react-icons/fa';
import AddBookModal from '../components/AddBookModal';
import EditBookModal from '../components/EditBookModal';
import API from '../../services/API';
import type { BookData } from '../../types/BookData';

interface Book {
  id: string;
  name: string;
  author: string;
  description: string;
  genreId: string; // 👈 rõ ràng đây là FK tới Genre
}

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
    genre: null, // 👈 để trống ban đầu
    description: '',
    file: null,
    cover: null,
  });
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  useEffect(() => {
    axios
      .get(API.genres)
      .then((res) => setGenres(res.data))
      .catch((err) => console.error('Lỗi khi lấy genres:', err));
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get(API.books);
      setBooks(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Xử lý nhấn nút sửa
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
        await axios.put(`${API.books}/${editingBook.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setEditingBook(null);
      } else {
        await axios.post(API.books, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
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
        await axios.delete(`${API.books}/${id}`);
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
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <tr key={book.id}>
                <td className="border p-2">{book.id}</td>
                <td className="border p-2">{book.name}</td>
                <td className="border p-2">{book.author}</td>
                <td className="border p-2">
                  {genres.find((g) => g.id === book.genreId)?.name || 'Không xác định'}
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

      {/* Modal Thêm sách */}
      {showAddModal && (
        <AddBookModal
          show={showAddModal}
          bookData={bookData}
          setBookData={setBookData}
          onSave={handleSaveBook}
          onCancel={() => setShowAddModal(false)}
          genreOptions={genres.map((g) => ({ label: g.name, value: g.id }))} // 👈 truyền option chuẩn
        />
      )}

      {/* Modal Sửa sách */}
      {editingBook && (
        <EditBookModal
          bookId={editingBook.id}
          currentGenreId={editingBook.genreId} // 👈 gửi id
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
