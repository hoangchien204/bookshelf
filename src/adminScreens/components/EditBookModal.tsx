import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API from '../../services/API';

interface Genre {
  id: string;
  name: string;
}

interface EditBookModalProps {
  bookId: string;
  currentGenreId: string;
  currentDescription: string;
  genres: Genre[];
  onClose: () => void;
  onUpdated: () => void;
}

const EditBookModal: React.FC<EditBookModalProps> = ({
  bookId,
  currentGenreId,
  currentDescription,
  genres,
  onClose,
  onUpdated,
}) => { 
    const [selectedGenreId, setSelectedGenreId] = useState<string>('');
  const [description, setDescription] = useState(currentDescription);
  const [error, setError] = useState('');

  useEffect(() => {
    // Nếu currentGenreId hợp lệ thì gán, không thì gán ID đầu tiên trong danh sách
    if (genres.length > 0) {
      const isValidGenreId = genres.some(g => g.id === currentGenreId);
      setSelectedGenreId(isValidGenreId ? currentGenreId : genres[0].id);
    }
  }, [genres, currentGenreId]);

  const handleUpdate = async () => {
    const selectedGenre = genres.find((g) => g.id === selectedGenreId);

    if (!selectedGenre) {
      setError('Không tìm thấy thể loại phù hợp.');
      return;
    }

    try {
      await axios.put(`${API.books}/${bookId}`, {
        genre: selectedGenre.name, // Gửi tên thể loại
        description,
      });

      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi khi cập nhật sách.');
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Chỉnh sửa sách</h2>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Thể loại</label>
          <select
            value={selectedGenreId}
            onChange={(e) => setSelectedGenreId(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            {genres.length > 0 ? (
              genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))
            ) : (
              <option disabled>Không có thể loại</option>
            )}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            rows={4}
          />
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Hủy
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBookModal;
