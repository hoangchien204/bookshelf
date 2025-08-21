import { useEffect, useState } from "react";
import API from "../../services/API";
import { toast } from "react-hot-toast";

export default function ProfilePage() {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("accessToken");

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load thông tin user
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API.users}/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        toast.error("Không thể tải thông tin hồ sơ!");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId, token]);

  // Upload avatar (gửi kèm với profile)
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Giả sử bạn có API upload file riêng để lấy URL
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API.users}/${userId}/avatar`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      setProfile({ ...profile, avatarUrl: data.url });

      toast.success("Ảnh đại diện đã được tải lên!");
    } catch (err) {
      toast.error("Upload ảnh thất bại!");
    }
  };

  // Lưu thông tin hồ sơ (PUT 1 lần cho tất cả)
  const handleSave = async () => {
    try {
      const res = await fetch(`${API.users}/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (!res.ok) throw new Error("Update failed");

      toast.success("Cập nhật hồ sơ thành công!");
    } catch (err) {
      toast.error("Cập nhật hồ sơ thất bại!");
    }
  };

  if (loading) return <p className="text-center mt-10">Đang tải...</p>;
  if (!profile) return <p className="text-center mt-10">Không tìm thấy user.</p>;

return (
  <div className="max-w-4xl mx-auto mt-10 bg-gray-900 text-white shadow-md rounded-lg p-6">
    <h2 className="text-2xl font-bold mb-6">Quản lý thông tin</h2>

    {/* Grid 2 cột */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Cột trái: thông tin */}
      <div className="md:col-span-2">
        <label className="block mb-2 text-sm font-medium">Tên đăng nhập</label>
        <input
          type="text"
          disabled
          value={profile.username || ""}
          className="w-full bg-gray-800 border border-gray-700 px-3 py-2 rounded mb-4 text-gray-400"
        />

        <label className="block mb-2 text-sm font-medium">ID người dùng</label>
        <input
          type="text"
          disabled
          value={profile.id || ""}
          className="w-full bg-gray-800 border border-gray-700 px-3 py-2 rounded mb-4 text-gray-400"
        />

        <label className="block mb-2 text-sm font-medium">Họ và tên</label>
        <input
          type="text"
          className="w-full bg-gray-800 border border-gray-700 px-3 py-2 rounded mb-4 text-white"
          value={profile.fullName || ""}
          onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium">Ngày sinh</label>
            <input
              type="date"
              className="w-full bg-gray-800 border border-gray-700 px-3 py-2 rounded mb-4 text-white"
              value={profile.dateOfBirth ? profile.dateOfBirth.substring(0, 10) : ""}
              onChange={(e) =>
                setProfile({ ...profile, dateOfBirth: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Giới tính</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 px-3 py-2 rounded mb-4 text-white"
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
          className="w-28 h-28 rounded-full border mb-3 object-cover"
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

    {/* Nút hành động */}
    <div className="flex justify-end gap-4 mt-6">
      <button
        onClick={handleSave}
        className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
      >
        Cập nhật
      </button>
    </div>
  </div>
);

}
