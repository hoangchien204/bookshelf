import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, EffectCoverflow } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/navigation";
// @ts-ignore
import "swiper/css/effect-coverflow";
import { FaHeart, FaBookOpen, FaAngleLeft, FaAngleRight, FaFire, FaClock } from "react-icons/fa";
import type { Book } from "../../types/Book";
import { useEffect, useRef, useState } from "react";

interface RecentBannerProps {
  books: Book[];
  onRead: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
  favorites: Book[];
  label?: string;
  iconType?: 'hot' | 'new';
}

export default function RecentBanner({
  books,
  onRead,
  onToggleFavorite,
  favorites,
  label = "Sách Mới",
  iconType = 'new'
}: RecentBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<any>(null);

  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (swiperRef.current && swiperRef.current.swiper) {
        swiperRef.current.swiper.update();
      }
    };

    window.addEventListener("resize", handleResize);
    const timeout = setTimeout(() => {
      if (swiperRef.current && swiperRef.current.swiper) {
        swiperRef.current.swiper.update();
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Xử lý duplicate slide nếu ít sách quá để swiper chạy mượt
  const displayBooks =
    books.length < 5 && books.length > 0
      ? Array(3)
          .fill(null)
          .flatMap((_, i) =>
            books.map((book) => ({
              ...book,
              uniqueId: `${book.id}-dup-${i}`,
            }))
          )
      : books;

  useEffect(() => setMounted(true), []);

  const activeBook = displayBooks[activeIndex] || displayBooks[0];

  if (!books || books.length === 0) return null;

  return (
    <div className="relative w-full mt-8 mb-12">
      {/* Label Banner */}
      <div className="flex items-center gap-2 mb-6 px-4 md:px-0">
        <span className={`p-2 rounded-full ${iconType === 'hot' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-400'}`}>
            {iconType === 'hot' ? <FaFire size={20} /> : <FaClock size={20} />}
        </span>
        <h3 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 uppercase tracking-wider">
          {label}
        </h3>
      </div>

      {mounted && (
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* LEFT: Thông tin sách */}
          <div className="hidden md:block relative z-10 w-full md:w-1/2 space-y-4 px-4 md:px-0">
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              {activeBook?.name}
            </h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed line-clamp-4">
              {activeBook?.description || "Không có mô tả chi tiết cho cuốn sách này."}
            </p>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => activeBook && onRead(activeBook)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full font-bold shadow-lg shadow-green-500/30 transition transform hover:-translate-y-1"
              >
                <FaBookOpen />
                Đọc Ngay
              </button>

              <button
                onClick={() => activeBook && onToggleFavorite(activeBook)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full border font-semibold transition transform hover:-translate-y-1
                  ${
                    activeBook && favorites.some((f) => f.id === activeBook.id)
                      ? "border-pink-500 text-pink-500 bg-pink-500/10"
                      : "border-gray-600 text-gray-300 hover:border-pink-500 hover:text-pink-500"
                  }`}
              >
                <FaHeart />
                {activeBook && favorites.some((f) => f.id === activeBook.id) ? "Đã Thích" : "Yêu Thích"}
              </button>
            </div>
          </div>

          {/* RIGHT: Carousel */}
          <div className="relative z-0 w-full md:w-1/2 flex justify-center">
            <Swiper
              ref={swiperRef}
              effect="coverflow"
              modules={[Navigation, Autoplay, EffectCoverflow]}
              observer={true}
              observeParents={true}
              grabCursor
              centeredSlides
              slidesPerView="auto"
              loop={displayBooks.length > 2}
              autoplay={{
                delay: 3500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 2.5,
              }}
              onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
              className="my-coverflow w-full h-[480px] sm:h-[520px] [perspective:1200px] overflow-visible"
            >
              {displayBooks.map((book, idx) => (
                <SwiperSlide
                  key={book.id} // Sử dụng uniqueId nếu là bản duplicate
                  className="swiper-slide !w-[240px] sm:!w-[260px] cursor-pointer"
                >
                  <div
                    className="relative group h-full flex justify-center items-center transform transition-transform"
                    onClick={() => onRead(book)}
                  >
                    {/* Shadow & Glow Effect */}
                    <div
                      className="absolute inset-0 rounded-lg scale-[0.9] blur-xl opacity-40 transition-all duration-700 group-hover:scale-[1] group-hover:opacity-60"
                      style={{
                        backgroundImage: `url(${book.coverUrl || "/default-cover.jpg"})`,
                        backgroundSize: "cover",
                      }}
                    />
                    <img
                      src={book.coverUrl || "/default-cover.jpg"}
                      alt={book.name}
                      className="relative z-10 w-full h-[360px] sm:h-[400px] object-cover rounded-lg shadow-2xl transition-all duration-500 group-hover:-translate-y-2"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Navigation buttons */}
            <button
              ref={prevRef}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-white/10 backdrop-blur-md p-3 rounded-full text-white transition border border-white/10"
            >
              <FaAngleLeft className="text-xl" />
            </button>
            <button
              ref={nextRef}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-white/10 backdrop-blur-md p-3 rounded-full text-white transition border border-white/10"
            >
              <FaAngleRight className="text-xl" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}