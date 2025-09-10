import { useState } from "react";
import { FiChevronLeft } from "react-icons/fi";
import { IoText, IoMenu } from "react-icons/io5";
import { MdFullscreen } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import type { Book } from "../../types/Book";

interface ReaderHeaderProps {
  book?: Book;
  bookName?: string;
  isFullscreen: boolean;
  setIsFullscreen: (val: boolean) => void;
  onOpenFontMenu: () => void;
  onToggleToc: (open: boolean) => void;
}

export default function ReaderHeader({
  book,
  bookName,
  isFullscreen,
  setIsFullscreen,
  onOpenFontMenu,
  onToggleToc,
}: ReaderHeaderProps) {
  const navigate = useNavigate();
  const [tocOpen, setTocOpen] = useState(false);

  const handleToggleToc = () => {
    const newState = !tocOpen;
    setTocOpen(newState);
    onToggleToc(newState);
  };
  return (
    <div className="flex justify-between items-center px-4 py-3 bg-black shadow-md relative">
      {/* Nút Back */}
      <button
        onClick={() => {
          if (isFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
          navigate(-1);
        }}
        className="text-2xl text-white hover:text-red-500"
      >
        <FiChevronLeft />
      </button>

      {/* Tên sách */}
      <h2 className="text-lg font-semibold text-white truncate max-w-[50%] text-center">
        {bookName || "Đang tải..."}
      </h2>

      <div className="flex items-center gap-4 text-xl text-white">
        {/* Luôn luôn hiển thị nút Fullscreen */}
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
              setIsFullscreen(true);
            } else {
              document.exitFullscreen();
              setIsFullscreen(false);
            }
          }}
          className="hover:text-blue-500"
          title="Phóng to/Thu nhỏ"
        >
          <MdFullscreen />
        </button>

        {/* Chỉ hiển thị khi là EPUB */}
        {book?.fileType === "epub" && (
          <>
            <button onClick={handleToggleToc} className="hover:text-blue-500" title="Mục lục">
              <IoMenu />
            </button>
            <button onClick={onOpenFontMenu} className="hover:text-blue-500" title="Chỉnh font chữ">
              <IoText />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
