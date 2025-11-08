// --- phần import giống bạn (giữ nguyên) ---
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, EffectCoverflow } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/navigation";
// @ts-ignore
import "swiper/css/effect-coverflow";
import { FaHeart, FaBookOpen, FaAngleLeft, FaAngleRight } from "react-icons/fa";
import type { Book } from "../../types/Book";
import { useEffect, useRef, useState } from "react";

interface RecentBannerProps {
  books: Book[];
  onRead: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
  favorites: Book[];
}

export default function RecentBanner({
  books,
  onRead,
  onToggleFavorite,
  favorites,
}: RecentBannerProps) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<any>(null);

  // navigation refs
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const handleResize = () => {
      if (swiperRef.current && swiperRef.current.swiper) {
        swiperRef.current.swiper.update();
      }
    };

    window.addEventListener("resize", handleResize);

    // Gọi update sau 300ms khi load lần đầu, để đảm bảo Swiper sync kích thước đúng
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

  const displayBooks =
    books.length < 5 && books.length > 2
      ? Array(3) 
        .fill(null)
        .flatMap((_, i) =>
          books.map((book) => ({
            ...book,
            duplicated: true,
            uniqueId: `${book.id}-dup-${i}`, 
          }))
        )
      : books;
  useEffect(() => setMounted(true), []);

  const activeBook = displayBooks[activeIndex] || displayBooks[0];
  return (
    <div className="relative w-full mt-12">
      {mounted && books.length > 0 && (
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Thông tin sách */}
          <div className="hidden md:block relative z-10 w-full md:w-1/2 space-y-4 px-4 md:px-0">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {activeBook?.name}
            </h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed line-clamp-5">
              {activeBook?.description ||
                "Không có mô tả chi tiết cho cuốn sách này."}
            </p>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => activeBook && onRead(activeBook)}
                className="flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 rounded-full font-semibold transition"
              >
                <FaBookOpen />
                Đọc sách
              </button>

              <button
                onClick={() => activeBook && onToggleFavorite(activeBook)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full border transition 
                  ${activeBook &&
                    favorites.some((f) => f.id === activeBook.id)
                    ? "border-green-500 text-green-500"
                    : "border-gray-500 text-gray-300 hover:border-green-400 hover:text-pink-400"
                  }`}
              >
                <FaHeart />
                Yêu thích
              </button>
            </div>
          </div>

          {/* RIGHT: cover-only carousel */}
          <div className="relative z-0 w-full md:w-1/2 flex justify-center">
            <Swiper
              effect="coverflow"
              modules={[Navigation, Autoplay, EffectCoverflow]}
              observer={true}
              observeParents={true}
              grabCursor
              centeredSlides
              slidesPerView="auto"
              loop={books.length > 2}
              autoplay={{
                delay: 10500,
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
              onResize={(swiper) => swiper.update()}
              className="my-coverflow w-full h-[520px] [perspective:1300px] overflow-visible"
            >
              {displayBooks.map((book) => (
                <SwiperSlide
                  key={book.id}
                  className="swiper-slide !w-[280px] md:!w-[220px] xl:!w-[320px] cursor-pointer"
                >
                  <div
                    className="relative group h-full flex justify-center items-center"
                    onClick={() => onRead(book)}
                  >
                    <div
                      className="absolute inset-0 rounded-2xl scale-[1.12] blur-2xl opacity-40 transition-all duration-700 group-hover:scale-[1.18] group-hover:opacity-60"
                      style={{
                        backgroundImage: `url(${book.coverUrl || "/default-cover.jpg"})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <img
                      src={book.coverUrl || "/default-cover.jpg"}
                      alt={book.name}
                      className="relative z-10 w-full h-[380px] sm:h-[420px] md:h-[440px] object-cover rounded-2xl shadow-2xl transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Navigation buttons */}
            <button
              ref={prevRef}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 p-2 rounded-full"
            >
              <FaAngleLeft className="text-xl text-white" />
            </button>
            <button
              ref={nextRef}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 p-2 rounded-full"
            >
              <FaAngleRight className="text-xl text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}