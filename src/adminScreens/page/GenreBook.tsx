import React, { useEffect, useState } from 'react';
import api from '../../types/api';
import API from '../../services/APIURL';
import { useGlobalModal } from '../../components/common/modal/GlobalModal';

interface Genre {
  id: string;
  name: string;
}

const GenreBook: React.FC = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [newGenre, setNewGenre] = useState('');
  const [editGenreId, setEditGenreId] = useState<string | null>(null);
  const [editGenreName, setEditGenreName] = useState('');
  const [error, setError] = useState('');
  const [deleteBlockedIds, setDeleteBlockedIds] = useState<string[]>([]); // những thể loại không thể xóa
  const { showModal } = useGlobalModal()
  const fetchGenres = async () => {
    try {
      const res = await api.get<Genre[]>(API.genres);
      setGenres(res.data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách thể loại:', err);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenre.trim()) {
      setError('Vui lòng nhập tên thể loại.');
      return;
    }
    try {
      await api.post(API.genres, { name: newGenre.trim() });
      setNewGenre('');
      setError('');
      fetchGenres();
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('Tên thể loại đã tồn tại.');
      } else {
        setError(err.response?.data?.message || 'Thêm thể loại thất bại.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa thể loại này?')) return;
    try {
      await api.delete(`${API.genres}/${id}`);
      fetchGenres();
      setDeleteBlockedIds((prev) => prev.filter((gid) => gid !== id));
      showModal("Xóa thể loại thành công!");
    } catch (err: any) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('sách')) {
        setDeleteBlockedIds((prev) => [...prev, id]);
        showModal("Không thể xóa: Thể loại đang liên kết với sách.", "error");
      } else {
        showModal("Xóa thể loại thất bại. Vui lòng thử lại.", "error");
      }
    }
  };

  const handleEdit = (genre: Genre) => {
    setEditGenreId(genre.id);
    setEditGenreName(genre.name);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditGenreId(null);
    setEditGenreName('');
    setError('');
  };

  const handleUpdate = async () => {
    if (!editGenreName.trim()) {
      setError('Tên thể loại không được để trống.');
      return;
    }
    try {
      await api.patch(`${API.genres}/${editGenreId}`, { name: editGenreName.trim() });
      setEditGenreId(null);
      setEditGenreName('');
      setError('');
      fetchGenres();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cập nhật thất bại.');
    }
  };

  return (
<div className="w-full min-h-screen p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Quản lý Thể loại Sách
      </h2>

      {/* Form thêm thể loại */}
      <form onSubmit={handleAddGenre} className="flex gap-3 mb-6">
        <input
          type="text"
          value={newGenre}
          onChange={(e) => setNewGenre(e.target.value)}
          placeholder="Nhập tên thể loại mới..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          Thêm
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Danh sách thể loại */}
      <div className="space-y-3">
        {genres.map((genre) => {
          const isBlocked = deleteBlockedIds.includes(genre.id);
          const isEditing = editGenreId === genre.id;

          return (
            <div
              key={genre.id}
              className={`flex justify-between items-center px-5 py-3 rounded-lg border shadow-sm hover:shadow-md transition-all ${isBlocked
                  ? "bg-gray-100 text-gray-400 border-gray-200"
                  : "bg-gray-50 text-gray-800 border-gray-300"
                }`}
            >
              {isEditing ? (
                <input
                  type="text"
                  value={editGenreName}
                  onChange={(e) => setEditGenreName(e.target.value)}
                  className="flex-1 mr-3 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <span className="text-lg font-medium">{genre.name}</span>
              )}

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleUpdate}
                      className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-400 text-white px-3 py-1 rounded-lg hover:bg-gray-500"
                    >
                      Hủy
                    </button>
                  </>
                ) : isBlocked ? (
                  <button
                    onClick={() =>
                      setDeleteBlockedIds((prev) =>
                        prev.filter((gid) => gid !== genre.id)
                      )
                    }
                    className="px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Hủy xóa
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(genre)}
                      className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(genre.id)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"
                    >
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

};

export default GenreBook;
