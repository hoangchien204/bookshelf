import React, { useEffect, useState } from 'react';
import API from '../../services/APIURL';
import api from '../../types/api';
import { useGlobalModal } from '../../components/common/modal/GlobalModal';
import Select from 'react-select'
interface Genre {
  id: string;
  name: string;
}

interface EditBookModalProps {
  bookId: string;
  currentGenreIds: string[];   // mảng thay vì 1 id
  currentDescription?: string;
  genres: Genre[];
  onClose: () => void;
  onUpdated: () => void;
}

const EditBookModal: React.FC<EditBookModalProps> = ({
  bookId,
  currentGenreIds,
  currentDescription,
  genres,
  onClose,
  onUpdated,
}) => {
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [description, setDescription] = useState(currentDescription ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const { showModal } = useGlobalModal();
  const genreOptions = genres.map((g) => ({
    value: g.id,
    label: g.name,
  }));
  // init selected genres
  useEffect(() => {
    if (genres.length > 0) {
      const validIds = currentGenreIds.filter((id) =>
        genres.some((g) => g.id === id)
      );
      setSelectedGenreIds(validIds.length > 0 ? validIds : [genres[0].id]);
    }
  }, [genres, currentGenreIds]);

  const handleUpdate = async () => {
    if (selectedGenreIds.length === 0) {
      setError('Vui lòng chọn ít nhất một thể loại.');
      return;
    }

    try {
      const formData = new FormData();
      selectedGenreIds.forEach((id) => formData.append('genres[]', id));


      formData.append('description', description);

      if (file) {
        formData.append('file', file);
      }

      await api.put(`${API.books}/${bookId}`, formData);

      showModal('Cập nhật sách thành công!');
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      showModal('Đã xảy ra lỗi khi cập nhật sách.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Chỉnh sửa sách</h2>

        {/* Thể loại */}

          <label className="block mb-1 font-medium">Thể loại</label>
          <Select
            isMulti
            options={genreOptions}
            value={genreOptions.filter((opt) => selectedGenreIds.includes(opt.value))}
            onChange={(selected) =>
              setSelectedGenreIds(selected.map((s) => s.value))
            }
            placeholder="Chọn thể loại..."
            className="w-full"
          />

        {/* Mô tả */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            rows={4}
          />
        </div>

        {/* File EPUB/PDF */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Tệp sách (PDF/EPUB)</label>
          <input
            type="file"
            accept=".pdf,.epub"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
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
