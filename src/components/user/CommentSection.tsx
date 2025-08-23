import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import API from "../../services/API";
import type { User } from "../../types/user";

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
  const [rating, setRating] = useState(0);
  const [activeTab, setActiveTab] = useState<"comments" | "reviews">("comments");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetch(`${API.comments}/book/${bookId}`)
      .then((res) => res.json())
      .then((data) => setComments(data));

    fetch(`${API.ratings}/book/${bookId}`)
      .then((res) => res.json())
      .then((data) => setReviews(data));
      
  }, [bookId]);

  // 🟢 Gửi bình luận
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(API.comments, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId ?? "",
        },
        body: JSON.stringify({
          bookId,
          content: newComment,
        }),
      });

      if (!res.ok) throw new Error(`Failed to post comment: ${res.statusText}`);
      const created = await res.json();
      setComments((prev) => [created, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error("Lỗi khi gửi comment:", err);
      alert("Không thể gửi bình luận. Vui lòng thử lại!");
    }
  };

  // 🟢 Gửi review
  const handleReviewSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newReview.trim() || rating === 0) return;

  try {
    const res = await fetch(API.ratings, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId ?? "",
      },
      body: JSON.stringify({
        bookId,
        score: rating,
        content: newReview,
      }),
    });

    if (!res.ok) throw new Error(`Failed to post review: ${res.statusText}`);
    const created = await res.json();

    // 🔑 Update nếu id đã tồn tại, nếu không thì thêm mới
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
    alert("Không thể gửi đánh giá. Vui lòng thử lại!");
  }
};
function formatDateVN(dateStr?: string) {
  if (!dateStr) return "Chưa xác định";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Ngày không hợp lệ";
  const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const now = new Date();
  const diff = Math.floor((now.getTime() - vnDate.getTime()) / 1000);

  if (diff < 60) return `${diff} giây trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} tuần trước`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} tháng trước`;

  return `${Math.floor(diff / 31536000)} năm trước`;
}
  return (
    <div className="mt-6">
 <div className="flex gap-6 border-b border-gray-600 mb-4">
  <button
    onClick={() => setActiveTab("comments")}
    className={`pb-2 font-semibold rounded-none focus:outline-none focus:ring-0 ${
      activeTab === "comments"
        ? "text-blue-400"
        : "text-gray-400"
    }`}
  >
    Bình luận
  </button>
  <button
    onClick={() => setActiveTab("reviews")}
    className={`pb-2 font-semibold rounded-none focus:outline-none focus:ring-0 ${
      activeTab === "reviews"
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
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <img
              src={c.user?.avatarUrl || "/default-avatar.png"}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 justify-between">
                <span className="font-semibold text-white">
                  {c.user?.fullName || c.user?.username || "Ẩn danh"}
                </span>
                <span className="text-gray-400 text-sm">
                   {formatDateVN(c.updatedAt || c.createdAt)}
                </span>
              </div>
              <p className="text-gray-200 mt-1">{c.content}</p>
            </div>
          </div>
        ))}
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
              className={`cursor-pointer ${
                star <= rating ? "text-yellow-400" : "text-gray-500"
              }`}
            />
          ))}
        </div>
        <textarea
          className="w-full border rounded-lg px-3 py-2 bg-gray-800 text-white"
          placeholder="Viết đánh giá..."
          value={newReview}
          onChange={(e) => setNewReview(e.target.value)}
        />
        <button
          type="submit"
          className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold"
        >
          Gửi đánh giá
        </button>
      </form>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="flex gap-3">
            <img
              src={r.user?.avatarUrl || "/default-avatar.png"}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 justify-between ">
                <span className="font-semibold text-white">
                  {r.user?.fullName || r.user?.username || "Ẩn danh"}
                </span>
                <span className="text-gray-400 text-sm">
                 {formatDateVN(r.updatedAt || r.createdAt)}
                </span>
              </div>
              <p className="text-yellow-400">⭐ {r.score}/5</p>
              <p className="text-gray-200 mt-1">
                {r.content || "(Không có nội dung)"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  )}
</div>

  );
};

export default CommentSection;
