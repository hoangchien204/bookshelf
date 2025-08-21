import React, { useState } from "react";
import { FaStar } from "react-icons/fa";

interface Comment {
  id: string;
  username: string;
  content: string;
  createdAt: string;
}

interface Review {
  id: string;
  username: string;
  rating: number;
  content: string;
  createdAt: string;
}

interface CommentSectionProps {
  bookId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ bookId }) => {
  // 🟡 Dữ liệu mock
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      username: "Nguyễn Văn A",
      content: "📖 Sách này rất hay, cốt truyện cuốn hút 👍",
      createdAt: "2025-08-20T10:30:00",
    },
    {
      id: "2",
      username: "Trần Thị B",
      content: "Mình thấy phần cuối hơi nhanh, nhưng vẫn ổn 😍",
      createdAt: "2025-08-21T08:45:00",
    },
  ]);

  const [reviews, setReviews] = useState<Review[]>([
    {
      id: "1",
      username: "Lê Văn C",
      rating: 5,
      content: "Tuyệt vời, rất đáng đọc!",
      createdAt: "2025-08-21T09:30:00",
    },
  ]);

  const [newComment, setNewComment] = useState("");
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(0);
  const [activeTab, setActiveTab] = useState<"comments" | "reviews">("comments");

  // 🟢 Thêm bình luận
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const fakeComment: Comment = {
      id: Math.random().toString(),
      username: "Bạn đọc ẩn danh",
      content: newComment,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [fakeComment, ...prev]);
    setNewComment("");
  };

  // 🟢 Thêm đánh giá
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim() || rating === 0) return;

    const fakeReview: Review = {
      id: Math.random().toString(),
      username: "Bạn đọc ẩn danh",
      rating,
      content: newReview,
      createdAt: new Date().toISOString(),
    };

    setReviews((prev) => [fakeReview, ...prev]);
    setNewReview("");
    setRating(0);
  };

  return (
    <div className="mt-6">
      <div className="flex gap-6 border-b border-gray-600 mb-4">
        <button
          onClick={() => setActiveTab("comments")}
          className={`pb-2 font-semibold ${
            activeTab === "comments"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400"
          }`}
        >
          Bình luận
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`pb-2 font-semibold ${
            activeTab === "reviews"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400"
          }`}
        >
          Đánh giá
        </button>
      </div>

      {activeTab === "comments" && (
        <>
          {/* Form nhập bình luận */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-6">
            <input
              type="text"
              className="flex-1 border rounded-lg px-3 py-2 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

          {/* Danh sách bình luận */}
          <div className="space-y-4">
            {comments.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 bg-gray-800 rounded-xl p-4 shadow-md"
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold">
                  {c.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{c.username}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-200 mt-1 leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "reviews" && (
        <>
          {/* Form nhập đánh giá */}
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
              className="w-full border rounded-lg px-3 py-2 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Viết đánh giá của bạn..."
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

          {/* Danh sách đánh giá */}
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 bg-gray-800 rounded-xl p-4 shadow-md"
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-yellow-500 text-white font-bold">
                  {r.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{r.username}</span>
                    <span className="text-gray-400 text-xs">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(r.rating)].map((_, i) => (
                      <FaStar key={i} size={16} className="text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-200 mt-1 leading-relaxed">{r.content}</p>
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
