import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import API from "../../services/APIURL";
import type { User } from "../../types/user";
import { FaPen } from "react-icons/fa";
import api from "../../types/api";
import { useGlobalModal } from "../common/GlobalModal";

interface Comment {
  id: string;
  content: string;
  updatedAt: string;
  createdAt?: string;
  user: User;
}

interface Review {
  id: string;
  score: number;
  content: string | null;
  updatedAt: string;
  createdAt: string;
  user: User;
}

interface CommentSectionProps {
  bookId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ bookId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newReview, setNewReview] = useState("");
  const [hover, setHover] = useState<number>(0);
  const [rating, setRating] = useState(0);
  const [activeTab, setActiveTab] = useState<"comments" | "reviews">("comments");
  const [visibleComments, setVisibleComments] = useState(5);
  const [visibleReviews, setVisibleReviews] = useState(5);
  const { showModal } = useGlobalModal()



  useEffect(() => {
    api(`${API.comments}/book/${bookId}`)
      .then((res) => res.data)
      .then((data) => setComments(data));

    api(`${API.ratings}/book/${bookId}`)
      .then((res) => res.data)
      .then((data) => setReviews(data));

  }, [bookId]);
  function maskUsername(username: string, visibleCount: number = 8): string {
    if (!username) return "Ẩn danh";
    if (username.length <= visibleCount) return username;
    return username.slice(0, visibleCount) + "*".repeat(5);
  }
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.post(API.comments, {
        bookId,
        content: newComment,
      });
      const created = await res.data;
      setComments((prev) => [created, ...prev]);
      setNewComment("");
    } catch (err) {
      showModal("Không thể gửi bình luận. Vui lòng thử lại!", "error");
    }
  };

  //Gửi review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim() || rating === 0) return;

    try {
      const res = await api.post(API.ratings, {
        bookId,
        score: rating,
        content: newReview,
      });
      const created = await res.data;
      setReviews((prev) => {
        const exists = prev.some((r) => r.id === created.id);
        return exists
          ? prev.map((r) => (r.id === created.id ? created : r))
          : [created, ...prev];
      });

      setNewReview("");
      setRating(0);
    } catch (err) {
      console.error("Lỗi khi gửi review:", err);
      showModal("Không thể gửi đánh giá. Vui lòng thử lại!", "error");
    }
  };
  function formatDateVN(dateStr?: string) {
    if (!dateStr) return "Chưa xác định";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Ngày không hợp lệ";

    const now = new Date();
    let diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 0) diff = 0; // tránh âm

    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    if (diff < 2592000) return `${Math.floor(diff / 604800)} tuần trước`;
    return date.toLocaleDateString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }



  return (
    <div className="mt-6">
      <div className="flex gap-6 border-b border-gray-600 mb-4">
        <button
          onClick={() => setActiveTab("comments")}
          className={`pb-2 font-semibold rounded-none focus:outline-none focus:ring-0 ${activeTab === "comments"
            ? "text-blue-400"
            : "text-gray-400"
            }`}
        >
          Bình luận
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`pb-2 font-semibold rounded-none focus:outline-none focus:ring-0 ${activeTab === "reviews"
            ? "text-blue-400"
            : "text-gray-400"
            }`}
        >
          Đánh giá
        </button>
      </div>

      {/* Comment Tab */}
      {activeTab === "comments" && (
        <>
          <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-6">
            <input
              type="text"
              className="flex-1 border rounded-lg px-3 py-2 bg-gray-800 text-white"
              placeholder="Viết bình luận..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Gửi
            </button>
          </form>

          <div className="space-y-4">
            {comments.length > 0 ? (
              <>
                {comments.slice(0, visibleComments).map((c) => (
                  <div key={c.id} className="flex gap-3 pb-4 border-b border-gray-700">
                    <img
                      src={c.user?.avatarUrl || "/default-avatar.png"}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 justify-between">
                        <span className="font-semibold text-white">
                          {c.user?.fullName || maskUsername(c.user?.username) || "Ẩn danh"}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {formatDateVN(c.updatedAt || c.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-200 mt-1">{c.content}</p>
                    </div>
                  </div>
                ))}
                {visibleComments < comments.length && (
                  <button
                    onClick={() => setVisibleComments((prev) => prev + 5)}
                    className="mt-3 text-blue-400 hover:underline"
                  >
                    Xem thêm bình luận
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col text-center justify-center items-center">
                <img src="/comment-empty.png" alt="" />
                <p className="text-gray-400">Chưa có bình luận nào</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Review Tab */}
      {activeTab === "reviews" && (
        <>
          <form onSubmit={handleReviewSubmit} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  size={24}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className={`cursor-pointer transition-colors duration-200 
          ${star <= (hover || rating) ? "text-yellow-400" : "text-gray-500"}`}
                />
              ))}
            </div>

            <textarea
              className="w-full border rounded-lg px-3 py-2 bg-gray-800 text-white resize-none"
              placeholder="Viết đánh giá..."
              value={newReview}
              onChange={(e) => {
                if (e.target.value.length <= 300) setNewReview(e.target.value);
              }}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-400 text-sm">
                {newReview.length}/300
              </span>
              <button
                type="submit"
                disabled={rating === 0 || newReview.trim().length === 0}
                className={`px-4 py-2 rounded-lg font-semibold transition
                   ${rating === 0 || newReview.trim().length === 0
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white cursor-pointer"
                  }`}
              >
                <FaPen className="inline mr-2" /> Gửi đánh giá
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {reviews.length > 0 ? (
              <>
                {reviews.slice(0, visibleReviews).map((r) => (
                  <div key={r.id} className="flex gap-3">
                    <img
                      src={r.user?.avatarUrl || "/default-avatar.png"}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      {/* Hàng đầu: Tên + Ngày */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">
                          {r.user?.fullName || r.user?.username || "Ẩn danh"}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {formatDateVN(r.updatedAt || r.createdAt)}
                        </span>
                      </div>


                      <div className="flex items-start justify-between mt-1 items-center">
                        <p className="text-gray-200">
                          {r.content || "(Không có nội dung)"}
                        </p>

                        <div className="flex ml-4">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              size={16}
                              className={star <= r.score ? "text-yellow-400" : "text-gray-500"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
                {visibleReviews < reviews.length && (
                  <button
                    onClick={() => setVisibleReviews((prev) => prev + 5)}
                    className="mt-3 text-blue-400 hover:underline"
                  >
                    Xem thêm đánh giá
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col text-center justify-center items-center">
                <img src="/review-empty.png" alt="" />
                <p className="text-gray-400">Chưa có đánh giá nào</p>
                <p className="text-gray-400">Hãy trở thành người đánh giá đầu tiên</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>

  );
};

export default CommentSection;
