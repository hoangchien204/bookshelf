import { useEffect, useState } from 'react';
import AddUserModal from '../components/AddUserModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import api from '../../types/api';
import API from '../../services/APIURL';
import toast from 'react-hot-toast';
import { useGlobalModal } from '../../components/common/GlobalModal';
import { useAuth } from '../../components/user/AuthContext';

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: string;
  createdAt: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 20;
  const {user} = useAuth()
  const userId = user?.id;
  const { notiFication } = useGlobalModal();

  const fetchUsers = async () => {
    try {
      const response = await api.get(API.users);
      setUsers(response.data);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu người dùng:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (id === userId) {
      notiFication("Bạn không thể xóa người này", "error");
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await api.delete(`${API.users}/${id}`);
        setUsers(users.filter((u) => u.id !== id));
        toast("Xóa thành công");
      } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          Thêm người dùng
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <FontAwesomeIcon icon={faSearch} />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên đăng nhập..."
          className="border px-3 py-1 rounded w-full max-w-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <>
          <table className="w-full border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Tên đăng nhập</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Quyền</th>
                <th className="border px-4 py-2">Ngày tạo</th>
                <th className="border px-4 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user.id}>
                  <td className="border px-4 py-2">{user.username}</td>
                  <td className="border px-4 py-2">{user.email}</td>
                  <td className="border px-4 py-2 capitalize">{user.role}</td>
                  <td className="border px-4 py-2">
                    {new Date(user.createdAt).toLocaleString('vi-VN', {
                      timeZone: 'Asia/Ho_Chi_Minh',
                    })}
                  </td>
                  <td className="border px-4 py-2 text-center">
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
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
                className={`px-3 py-1 rounded-full ${
                  currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
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
        </>
      )}

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onUserAdded={() => fetchUsers()}
        />
      )}
    </div>
  );
};

export default UserManagement;
