import { useNavigate, useParams, useLocation } from "react-router-dom";
import { slugify } from "../utils/slug";
import type { Book } from "../types/Book";
import API from "../services/API";
import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart, FaLink } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

const BookDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slugAndId } = useParams();

  // Lấy id từ URL
  const id =
    slugAndId?.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
    )?.[0] || "";

  // Ưu tiên lấy book từ state
  const [book, setBook] = useState<Book | null>(location.state?.book || null);
  const [loading, setLoading] = useState(!location.state?.book);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // cooldown
const [showLoginModal, setShowLoginModal] = useState(false);

  const userId = localStorage.getItem("userId");
const [showFullDescription, setShowFullDescription] = useState(false);

const MAX_LENGTH = 200; // số ký tự tối đa khi rút gọn
useEffect(() => {
    if (!userId) {
      setShowLoginModal(true);
    }
  }, [userId]);


  useEffect(() => {
    if (!id || book) return;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API.books}/${id}`);
        setBook(res.data);
      } catch (error) {
        console.error("Lỗi lấy chi tiết sách:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, book]);

  useEffect(() => {
  if (!id || !userId) return;
  (async () => {
    try {
      const res = await axios.get(API.favorites, {
        headers: { "x-user-id": userId },
      });
      if (Array.isArray(res.data)) {
        setIsFavorite(res.data.some((fav: any) => fav.id === id));
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách yêu thích:", error);
    }
  })();
}, [id, userId]);
const handleCopyLink = () => {
  const link = window.location.href;
  navigator.clipboard.writeText(link)
    .then(() => {
      toast.success("Đã sao chép liên kết!");
  })
  .catch(err => {
    console.error("Lỗi sao chép liên kết:", err);
    toast.error("Không thể sao chép liên kết");
    });
};
  const handleToggleFavorite = async () => {
  if (!id || !userId || isProcessing) return;
  setIsProcessing(true);
  setIsFavorite(prev => !prev);
  try {
    const response = await axios.post(
      API.favorites,
      { bookId: id },
      { headers: { "x-user-id": userId } }
    );
    if (typeof response.data.isFavorite !== "undefined") {
      setIsFavorite(response.data.isFavorite);
      if (response.data.isFavorite) {
  toast.success(
    <span className="flex items-center gap-2">
      Yêu thích thành công
    </span>
  );
} else {
  toast.success(
    <span className="flex items-center gap-2">
      Bỏ yêu thích thành công
    </span>,
  );
}
    }
  } catch (error) {
    console.error("Lỗi toggle yêu thích:", error);
    setIsFavorite(prev => !prev);
  } finally {
    setTimeout(() => setIsProcessing(false), 500);
  }
};
  const handleReadClick = () => {
    if (!book) return;
    const slug = slugify(book.name);
    navigate(`/read/${slug}-${book.id}`);
  };
useEffect(() => {
  document.body.style.placeItems = "unset";
  document.body.style.display = "block";

  return () => {
    document.body.style.placeItems = "center"; // hoặc giá trị cũ
    document.body.style.display = "grid"; // hoặc flex
  };
}, []);
  if (loading) return <div className="text-center py-8">Đang tải...</div>;
  if (!book) return <div className="text-center py-8">Không tìm thấy sách</div>;
  const description = book.description || "Chưa có mô tả";
  const isLong = description.length > MAX_LENGTH;
  const displayedText = showFullDescription
    ? description
    : description.slice(0, MAX_LENGTH) + (isLong ? "..." : "");

   if (showLoginModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
          <h2 className="text-lg font-semibold mb-4">
            Bạn cần đăng nhập để xem chi tiết sách
          </h2>
          <button
            onClick={() => navigate("/login")}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }
  
return (
<div className="book-detail-page w-screen flex flex-col md:flex-row bg-gradient-to-br from-gray-900 to-gray-800 text-white">
    {/* mobi */}
    <div className="w-full md:hidden relative flex flex-col items-center pb-6">
  {/* Ảnh nền full width */}
  <img
    src={book.coverUrl}
    alt="background"
    className="absolute inset-0 w-full h-full object-cover opacity-100"
  />
{/* lớp phủ */}
  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40"></div>
  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
  <img
    src={book.coverUrl}
    alt={book.name}
    className="relative w-40 sm:w-48 rounded-lg shadow-lg object-cover z-10 mt-8"
  />
  <div className="relative z-10 text-center px-4 mt-4">
    <h1 className="text-lg font-bold">{book.name}</h1>
    <p className="text-sm text-gray-200">Tác giả: {book.author}</p>
  </div>
  <div className="relative z-10 flex items-center gap-3 mt-4 px-6 w-full">
    <button
      onClick={handleReadClick}
      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition"
    >
      Đọc sách
    </button>
    <button
      onClick={handleToggleFavorite}
      className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition"
    >
      {isFavorite ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
    </button>
    <button
      onClick={handleCopyLink}
      className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition"
    >
      <FaLink />
    </button>
  </div>
</div>
<div className="md:hidden px-6 mt-4 flex flex-wrap gap-2">
  <span className="bg-gray-700 text-white text-sm px-3 py-1 rounded-full">
    {book.genre || "Không rõ"}
  </span>
</div>

    {/* --- Desktop --- */}
   <div className="hidden md:block md:w-[400px] flex-shrink-0 md:sticky md:top-0 self-start p-6">
  <div className="relative w-full">
    <img
      src={book.coverUrl}
      alt={book.name}
      className="w-full rounded-lg shadow-lg object-cover"
    />
  </div>
</div>

    {/* Nội dung Desktop */}
    <div className="flex-1 p-6 space-y-6 overflow-y-auto text-left">
      
      {/* Thông tin chung - chỉ Desktop */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold mb-4">{book.name}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 text-sm font-sans">
          <div>
            <div className="text-gray-300 font-medium">Tác giả</div>
            <div className="text-white">{book.author}</div>
          </div>
          <div>
            <div className="text-gray-300 font-medium">Thể loại</div>
            <div className="text-white">{book.genre || "Không rõ"}</div>
          </div>
          <div>
            <div className="text-gray-300 font-medium">Trạng thái</div>
            <div className="text-white">{book.isSeries ? "Đang ra" : "Hoàn thành"}</div>
          </div>
          <div>
            <div className="text-gray-300 font-medium">Nhà xuất bản</div>
            <div className="text-white">Đang cập nhật</div>
          </div>
          <div>
            <div className="text-gray-300 font-medium">Ngày phát hành</div>
            <div className="text-white">
              {new Date(book.createdAt).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>
      </div>

      {/* Nút hành động - Desktop */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        <button
          onClick={handleReadClick}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition"
        >
          Đọc sách
        </button>
        <button
          onClick={handleToggleFavorite}
          className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition"
        >
          {isFavorite ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
        </button>
        <button
          onClick={handleCopyLink}
          className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition"
        >
          <FaLink />
        </button>
      </div>

      {/* Mô tả */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Mô tả</h2>
        <p className="text-gray-300">
          {displayedText}
          {isLong && (
            <button
              onClick={() => setShowFullDescription(prev => !prev)}
              className="ml-2 text-green-400 no-underline cursor-pointer focus:outline-none"
            >
              {showFullDescription ? "Rút gọn" : "Xem thêm"}
            </button>
          )}
        </p>
      </div>

      {/* Danh sách tập */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Danh sách tập</h2>
      </div>
    </div>
  </div>
);
};

export default BookDetailPage;
