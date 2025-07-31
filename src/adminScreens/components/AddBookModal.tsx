import React from 'react';
import Select from 'react-select';

interface GenreOption {
  label: string;
  value: string;
}

interface BookData {
  name: string;
  author: string;
  genre: string;
  description: string;
  file?: File | null;
  cover?: File | null;
}

interface AddBookModalProps {
  show: boolean;
  bookData: BookData;
  setBookData: (data: BookData) => void;
  onSave: (newBookData: BookData) => void;
  onCancel: () => void;
  genreOptions: GenreOption[];
}

const AddBookModal: React.FC<AddBookModalProps> = ({
  show,
  bookData,
  setBookData,
  onSave,
  onCancel,
  genreOptions,
}) => {
  if (!show) return null;

  const handleChange = (field: keyof BookData, value: any) => {
    setBookData({ ...bookData, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[360px] shadow-xl">
        <h2 className="text-xl font-semibold text-center mb-4">📚 Thêm sách mới</h2>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => handleChange('file', e.target.files?.[0] || null)}
          className="mb-3 w-full text-sm"
        />

        <input
          type="text"
          placeholder="Tên sách"
          value={bookData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="mb-3 w-full p-2 border rounded"
        />

        <input
          type="text"
          placeholder="Tác giả"
          value={bookData.author}
          onChange={(e) => handleChange('author', e.target.value)}
          className="mb-3 w-full p-2 border rounded"
        />

        <Select
          options={genreOptions}
          value={genreOptions.find((opt) => opt.value === bookData.genre)}
          onChange={(selected) => handleChange('genre', selected?.value || '')}
          placeholder="Chọn thể loại..."
          isClearable
          className="mb-3"
        />

        <textarea
          placeholder="Mô tả"
          value={bookData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="mb-3 w-full p-2 border rounded resize-none"
          rows={3}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleChange('cover', e.target.files?.[0] || null)}
          className="mb-4 w-full text-sm"
        />

        <div className="flex justify-between">
          <button
            onClick={() => onSave(bookData)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
          >
            Lưu
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBookModal;
