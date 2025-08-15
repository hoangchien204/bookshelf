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

  const userId = localStorage.getItem("userId");
const [showFullDescription, setShowFullDescription] = useState(false);

const MAX_LENGTH = 200; // số ký tự tối đa khi rút gọn
if (!book) return <div>Không tìm thấy sách</div>;
const description = book.description || "Chưa có mô tả";
const isLong = description.length > MAX_LENGTH;
const displayedText = showFullDescription
  ? description
  : description.slice(0, MAX_LENGTH) + (isLong ? "..." : "");

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

      console.log("Favorites list response:", res.data);

      if (Array.isArray(res.data)) {
        setIsFavorite(res.data.some((fav: any) => fav.id === id));
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách yêu thích:", error);
    }
  })();
}, [id, userId]);
const handleCopyLink = () => {
  // Lấy link hiện tại
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

    // Nếu API trả isFavorite, cập nhật lại cho khớp server
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

  if (loading) return <div className="text-center py-8">Đang tải...</div>;
  if (!book) return <div className="text-center py-8">Không tìm thấy sách</div>;

  return (
  <div className="w-full flex flex-col md:flex-row bg-gradient-to-br from-gray-900 to-gray-800 text-white">
    {/* Ảnh bìa - cố định bên trái */}
    <div className="md:w-[300px] flex-shrink-0 md:sticky md:top-0 self-start p-6">
      <div className="relative w-full">
        <img
          src={book.coverUrl}
          alt={book.name}
          className="w-full rounded-lg shadow-lg object-cover"
        />
        
      </div>
    </div>

    <div className="flex-1 p-6 space-y-6 overflow-y-auto text-left">
  {/* Thông tin chung */}
  <div>
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

  {/* Nút hành động */}
  <div className="flex items-center gap-3 flex-wrap">
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
      {isFavorite ? (
        <FaHeart className="text-red-500" />
      ) : (
        <FaRegHeart />
      )}
    </button>
    <button
    onClick={handleCopyLink} 
    className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition">
      <FaLink />
    </button>
  </div>

  <div>
    <h2 className="text-xl font-semibold mb-2">Mô tả</h2>
   <p className="text-gray-300">
  {displayedText}
  {isLong && (
    <button
      onClick={() => setShowFullDescription(prev => !prev)}
      className="ml-2 text-green-400 no-underline cursor-pointer focus:outline-none focus:ring-0 active:outline-none active:ring-0 border-none"

    >
      {showFullDescription ? "Rút gọn" : "Xem thêm"}
    </button>
  )}
</p>
  </div>

  <div>
    <h2 className="text-xl font-semibold mb-2">Danh sách tập</h2>
  </div>
</div>
  </div>
);
};

export default BookDetailPage;
