// components/AddUserModal.tsx
import React, { useState } from 'react';
import API from '../../services/API';
import axios from 'axios';
interface AddUserModalProps {
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onUserAdded }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: '0',
  });
  const accessToken = localStorage.getItem('accessToken')
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(API.users,formData,{
        headers:{
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        }
      });
      onUserAdded();
      onClose();
    } catch (error) {
      console.error('Lỗi khi thêm người dùng:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Thêm người dùng</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="block mb-1 font-medium">Tên đăng nhập</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="border w-full px-3 py-1.5 rounded"
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="border w-full px-3 py-1.5 rounded"
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1 font-medium">Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="border w-full px-3 py-1.5 rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Quyền</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="border w-full px-3 py-1.5 rounded"
            >
              <option value="0">Người dùng</option>
              <option value="1">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
              Thêm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
