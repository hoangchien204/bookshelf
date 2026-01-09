import { useEffect, useState } from "react";
import API from "../../services/APIURL";
import { toast } from "react-hot-toast";
import api from "../../types/api";
import ChangePasswordModal from "./ChangePasswordModal";

export default function ProfilePage() {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const currentUserId = profile?.id || profile?.userId;
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(API.ME);
        setProfile(res.data.user || res.data);
      } catch (err) {
        toast.error("Không thể tải thông tin hồ sơ! Vui lòng đăng nhập lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Upload avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post(
        `${API.users}/${currentUserId}/avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProfile({ ...profile, avatarUrl: res.data.url || res.data.avatarUrl });
      toast.success("Ảnh đại diện đã được tải lên!");
    } catch (err) {
      toast.error("Upload ảnh thất bại!");
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      const res = await api.put(`${API.users}/${currentUserId}`, profile);

      if (!res.data) throw new Error("Update failed");
      toast.success("Cập nhật hồ sơ thành công!");
    } catch (err) {
      toast.error("Cập nhật hồ sơ thất bại!");
    }
  };

  if (loading) return <p className="text-center mt-10">Đang tải...</p>;
  if (!profile) return <p className="text-center mt-10">Không tìm thấy user.</p>;

  const safeDate = profile.dateOfBirth
    ? (typeof profile.dateOfBirth === 'string' ? profile.dateOfBirth.substring(0, 10) : '')
    : '';

  const displayId = profile.id || profile.userId || "";

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-gray-900 text-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Quản lý thông tin</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cột trái: thông tin */}
        <div className="md:col-span-2">
          <label className="block mb-2 text-sm font-medium">Tên đăng nhập</label>
          <input
            type="text"
            disabled
            value={profile.username || ""}
            className="w-full bg-gray-800 border border-gray-700 px-3 py-2 rounded mb-4 text-gray-400 cursor-not-allowed"
          />

          <label className="block mb-2 text-sm font-medium">ID người dùng</label>
          <input
            type="text"
            disabled
            value={displayId}
            className="w-full bg-gray-800 border border-gray-700 px-3 py-2 rounded mb-4 text-gray-400 cursor-not-allowed"
          />

          <label className="block mb-2 text-sm font-medium">Họ và tên</label>
          <input
            type="text"
            className="w-full bg-gray-800 border border-gray-700 px-3 py-2 rounded mb-4 text-white focus:outline-none focus:border-green-500"
            value={profile.fullName || ""}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Ngày sinh</label>
              <input
                type="date"
                className="w-full bg-gray-800 border border-gray-700 px-3 py-2 rounded mb-4 text-white focus:outline-none focus:border-green-500"
                value={safeDate}
                onChange={(e) =>
                  setProfile({ ...profile, dateOfBirth: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Giới tính</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 px-3 py-2 rounded mb-4 text-white focus:outline-none focus:border-green-500"
                value={profile.gender || ""}
                onChange={(e) =>
                  setProfile({ ...profile, gender: e.target.value })
                }
              >
                <option value="">-- Chọn giới tính --</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cột phải: avatar */}
        <div className="flex flex-col items-center">
          <img
            src={profile.avatarUrl || "/default-avatar.png"}
            alt="Avatar"
            className="w-28 h-28 rounded-full border border-gray-600 mb-3 object-cover shadow-lg"
          />
          <input
            id="avatarUpload"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <label
            htmlFor="avatarUpload"
            className="cursor-pointer px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-full shadow hover:bg-green-600 transition"
          >
            Thay ảnh
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
          onClick={() => setShowChangePassword(true)}
        >
          Đổi mật khẩu
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
        >
          Cập nhật
        </button>
      </div>
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}