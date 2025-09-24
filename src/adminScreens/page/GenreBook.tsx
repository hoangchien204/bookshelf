import React, { useEffect, useState } from 'react';
import api from '../../types/api';
import API from '../../services/APIURL';

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
    alert("✅ Xóa thể loại thành công!");
  } catch (err: any) {
    const msg = err.response?.data?.message || '';
    if (msg.includes('sách')) {
      setDeleteBlockedIds((prev) => [...prev, id]);
      alert("❌ Không thể xóa: Thể loại đang liên kết với sách.");
    } else {
      console.error('Xóa thể loại thất bại:', err);
      alert("❌ Xóa thể loại thất bại. Vui lòng thử lại.");
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
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Quản lý Thể loại sách</h2>

      <form onSubmit={handleAddGenre} className="flex gap-3 mb-6">
        <input
          type="text"
          value={newGenre}
          onChange={(e) => setNewGenre(e.target.value)}
          placeholder="Nhập tên thể loại mới"
          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
        >
          Thêm
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="grid gap-4">
        {genres.map((genre) => {
          const isBlocked = deleteBlockedIds.includes(genre.id);
          const isEditing = editGenreId === genre.id;

          return (
            <div
              key={genre.id}
              className={`flex justify-between items-center border px-4 py-2 rounded shadow-sm hover:shadow-md transition ${
                isBlocked ? 'bg-gray-100 text-gray-400' : ''
              }`}
            >
              {isEditing ? (
                <input
                  type="text"
                  value={editGenreName}
                  onChange={(e) => setEditGenreName(e.target.value)}
                  className="flex-1 mr-3 px-3 py-1 border rounded"
                />
              ) : (
                <span className="text-gray-800 font-medium">{genre.name}</span>
              )}

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleUpdate}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                    >
                      Hủy
                    </button>
                  </>
                ) : isBlocked ? (
                  <button
                    onClick={() => setDeleteBlockedIds((prev) => prev.filter((gid) => gid !== genre.id))}
                    className="text-gray-500 hover:underline"
                  >
                    Hủy xóa
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(genre)}
                      className="text-blue-600 hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(genre.id)}
                      className="text-red-600 hover:underline"
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
