import { useNavigate, useParams, useLocation } from "react-router-dom";
import { slugify } from "../../utils/slug";
import type { Book } from "../../types/Book";
import API from "../../services/APIURL";
import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart, FaStar, FaBookOpen, FaShareAlt } from "react-icons/fa";
import api from "../../types/api";
import toast from "react-hot-toast";
import CommentSection from "../user/CommentSection";
import BookCard from "./BookCard";
import HorizontalSlider from "../common/HorizontalSlider";
import Loading from "../common/Loading";
import { useGlobalModal } from "../common/GlobalModal";

const BookDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [rating, setRating] = useState<number>(0);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestedBooks, setSuggestedBooks] = useState<Book[]>([]);
  const [book, setBook] = useState<Book | null>(location.state?.book || null);
  const [loading, setLoading] = useState(!location.state?.book);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { showModal } = useGlobalModal()

  const userId = localStorage.getItem("userId");
  const accessToken = localStorage.getItem("accessToken");

  const { slugAndId: slugParam } = useParams();
  const id =
    slugParam?.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
    )?.[0] || "";
  const [volumes, setVolumes] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const MAX_LENGTH = 200;

  // Fetch chi tiết sách
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`${API.books}/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setBook(res.data);
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Fetch danh sách yêu thích
  useEffect(() => {
    if (!userId || !accessToken) return;
    (async () => {
      try {
        const res = await api.get(API.favorites, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (Array.isArray(res.data)) {
          setFavorites(res.data.map((fav: any) => fav.id));
        }
      } catch (error) {
        console.error("Lỗi:", error);
      }
    })();
  }, [userId, accessToken]);

  // Fetch rating
  useEffect(() => {
    if (!book?.id) return;
    (async () => {
      try {
        const res = await api.get(`${API.ratings}/book/${book.id}/average`);
        setRating(res.data > 0 ? res.data : 5);
      } catch (err) {
        console.error("Lỗi:", err);
        setRating(5);
      }
    })();
  }, [book?.id]);

  // Fetch sách cùng tác giả
  useEffect(() => {
    if (!book) return;
    (async () => {
      const res = await fetch(`${API.books}/author/${encodeURIComponent(book.author)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRelatedBooks(data.filter((b: Book) => b.id !== book.id));
      }
    })();
  }, [book]);

  // Fetch random "có thể bạn sẽ thích"
  useEffect(() => {
    if (!book) return;
    (async () => {
      const res = await fetch(`${API.random}/${book.id}?limit=10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setSuggestedBooks(await res.json());
      }
    })();
  }, [book]);
  // Danh sách tập 
  useEffect(() => {
    if (!book?.id || !book?.seriesId) return
    (async () => {
      try {
        const res = await api.get(`${API.series}/${book.seriesId}/books`);
        setVolumes(res.data);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách chương:", err);
      }
    })();
  }, [book?.id]);
  // Toggle favorite (chung cho mọi sách)
  const handleToggleFavorite = async (bookId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Bạn cần đăng nhập để yêu thích sách");
        return;
      }

      const response = await api.post(
        API.favorites,
        { bookId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (typeof response.data.isFavorite !== "undefined") {
        setFavorites((prev) =>
          response.data.isFavorite
            ? [...prev, bookId]
            : prev.filter((id) => id !== bookId)
        );

        toast.success(
          response.data.isFavorite
            ? "Yêu thích thành công"
            : "Bỏ yêu thích thành công"
        );
      }
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setTimeout(() => setIsProcessing(false), 500);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success("Đã sao chép liên kết!"))
      .catch(() => toast.error("Không thể sao chép liên kết"));
  };

  const handleReadClick = () => {
    if (!book) return;
    const slug = slugify(book.name);
    navigate(`/read/${slug}-${book.id}`);
  };

  const handleRead = async (book: Book) => {
    try {
      const res = await api.get(`${API.read}/${book.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const lastPage = res.data.page || 1;
      const slug = slugify(book.name);
      navigate(`/book/${slug}-${book.id}`, { state: { startPage: lastPage } });
    } catch (err: any) {
      if (err.response?.status === 401) {
        showModal("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "error");
      }
    }
  };
  useEffect(() => {
    document.body.style.placeItems = "unset";
    document.body.style.display = "block";

    return () => {
      document.body.style.placeItems = "center";
      document.body.style.display = "grid";
    };
  }, []);
  const RatingBadge: React.FC<{ score: number }> = ({ score }) => {
    return (
      <div className="flex items-center gap-1 bg-gray-700 text-white text-sm px-3 py-1 rounded-full">
        <FaStar className="text-yellow-400" />
        <span>{score.toFixed(1)}/5</span>
      </div>
    );
  };


  if (loading) return <Loading />;
  if (!book) return <div className="text-center py-8">Không tìm thấy sách</div>;
  const description = book.description || "Chưa có mô tả";
  const isLong = description.length > MAX_LENGTH;
  const displayedText = showFullDescription
    ? description
    : description.slice(0, MAX_LENGTH) + (isLong ? "..." : "");



  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="book-detail-page w-screen flex flex-col md:flex-row bg-gradient-to-br 
                    from-gray-900 to-gray-800 text-white pt-0 sm:pt-20 roboto-slab">
        {/* mobi */}
        <div className="w-full md:hidden relative flex flex-col items-center pb-6">
          <img
            src={book.coverUrl}
            alt="background"
            className="absolute inset-0 w-full h-full object-cover opacity-100"
          />
          {/* lớp phủ */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent"></div>

          <img
            src={book.coverUrl}
            alt={book.name}
            className="relative w-[180px] h-[265px] rounded-lg shadow-lg object-cover z-10 mt-8"
          />
          <div className="relative z-10 text-center px-4 mt-4">
            <h1 className="text-lg font-bold">{book.name}</h1>
            <p className="text-sm text-gray-200">Tác giả: {book.author}</p>
          </div>
          <div className="relative z-10 flex items-center gap-3 mt-4 px-6 w-full">
            <button
              onClick={handleReadClick}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 flex text-center justify-center items-center
            rounded-3xl font-semibold transition gap-2 text-lg"
            >
              <FaBookOpen /> Đọc sách
            </button>
            <button
              onClick={() => handleToggleFavorite(id)}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full transition text-lg"
            >
              {favorites.includes(id) ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
            </button>
            <button
              onClick={handleCopyLink}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full transition text-lg"
            >
              <FaShareAlt />
            </button>
          </div>
        </div>

        <div className="md:hidden px-6 mt-4 flex flex-wrap gap-2">
          <span className="flex items-center bg-gray-700 text-white text-base px-3 py-1 rounded-full">
            <RatingBadge score={rating} />
          </span>
          <span className="bg-gray-700 text-white text-sm px-3 py-1 rounded-full flex justify-center items-center">
            {book.genre?.name || "Không rõ"}
          </span>
        </div>

        <div className="hidden md:block md:w-[400px] flex-shrink-0 md:sticky md:top-0 self-start p-6">
          <div className="relative w-full">
            <img
              src={book.coverUrl}
              alt={book.name}
              className="w-[330px] h-[528px] rounded-lg shadow-lg object-cover"
            />
          </div>
        </div>

        {/* Nội dung Desktop */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto text-left max-w-3xl">

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
                <div className="text-white">{book.genre?.name || "Không rõ"}</div>
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
              className="bg-green-500 hover:bg-green-600 text-white flex text-center justify-center items-center gap-2 px-6 py-2 
                        rounded-2xl font-semibold transition w-[201px]"
            >
              <FaBookOpen />Đọc sách
            </button>
            <button
              onClick={() => handleToggleFavorite(id)}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full transition text-2xl"
            >
              {favorites.includes(id) ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
            </button>
            <button
              onClick={handleCopyLink}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full transition text-2xl"
            >
              <FaShareAlt />
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
            {book.seriesId ? (
              <>
                <h2 className="text-xl font-semibold mb-2">Danh sách tập</h2>

                {(() => {
                  const itemsPerPage = 4;
                  const totalPages = Math.ceil(volumes.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const currentVolumes = volumes.slice(startIndex, endIndex);

                  return (
                    <>
                      <div className="space-y-3 mb-4">
                        {currentVolumes.length > 0 ? (
                          currentVolumes.map((vol) => (
                            <div
                              key={vol.id}
                              className={`flex justify-between items-center bg-gray-800 hover:bg-gray-700 transition p-4 rounded-xl cursor-pointer ${String(vol.id) === String(book.id)
                                ? "ring-2 ring-green-500"
                                : ""
                                }`}
                              onClick={() =>
                                navigate(`/book/${slugify(vol.name)}-${vol.id}`)
                              }
                            >
                              <h3 className="font-semibold text-white truncate">
                                {vol.name}
                              </h3>
                              <button className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap">
                                Đọc Ngay
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400">
                            Chưa có tập nào khác trong series này.
                          </p>
                        )}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mb-6">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 bg-gray-700 text-white rounded disabled:opacity-50 rounded-full"
                          >
                            ←
                          </button>

                          <span className="text-white text-sm">
                            Trang {currentPage} / {totalPages}
                          </span>

                          <button
                            onClick={() =>
                              setCurrentPage((p) => Math.min(p + 1, totalPages))
                            }
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 bg-gray-700 text-white rounded disabled:opacity-50 rounded-full"
                          >
                            →
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}

                <h2 className="text-xl font-semibold mb-2">
                  Độc giả nói gì về "{book.name}"
                </h2>
                <CommentSection bookId={book.id} />
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-2">
                  Độc giả nói gì về "{book.name}"
                </h2>
                <CommentSection bookId={book.id} />
              </>
            )}
          </div>
        </div>

      </div>

      {/* Nếu có sách cùng tác giả */}
      {relatedBooks.length > 0 && (
        <div className="mt-8 relative p-6">
          <h2 className="text-2xl font-semibold mb-2 text-white">
            Sách cùng tác giả
          </h2>

          <HorizontalSlider itemWidth={250} gap="gap-4 sm:gap-6 md:gap-10 lg:gap-20">
            {relatedBooks.map((b) => (
              <div
                key={b.id}
                className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-48"
              >
                <BookCard
                  book={b}
                  onRead={() => handleRead(b)}
                  onToggleFavorite={handleToggleFavorite}
                  isFavorite={favorites.includes(b.id)}
                />
              </div>
            ))}
          </HorizontalSlider>
        </div>
      )}

      {/* Phần "Có thể bạn sẽ thích" luôn có */}
      <div className="mt-8 relative p-6 ">
        <h2 className="text-2xl font-semibold mb-2 text-white">
          Có thể bạn sẽ thích
        </h2>

        <HorizontalSlider itemWidth={250} gap="gap-6 md:gap-10 lg:gap-20">
          {suggestedBooks.map((b) => (
            <div key={b.id} className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-48">
              <BookCard
                book={b}
                onRead={() => handleRead(b)}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={favorites.includes(b.id)}
              />
            </div>
          ))}
        </HorizontalSlider>
      </div>

    </div>
  );
};

export default BookDetailPage;
