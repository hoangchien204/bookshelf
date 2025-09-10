import React, { useEffect, useState } from "react";
import { Document } from "react-pdf";
import PdfPageWrapper from "../common/PdfPageWrapper";
import { FiChevronLeft, FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import axios from "axios";
import API from "../../services/API";
import type { Book } from "../../types/Book";
import EpubReaderWrapper from "../common/EpubReaderWrapper"; 
import ReaderMenu from "../common/ReaderMenu"; // ✅ dùng lại menu PC

interface Props {
  book: Book;
  userId: string | null;
  accessToken: string | null;
}

const BookReaderMobile: React.FC<Props> = ({ book, userId, accessToken }) => {
  const [pageWidth] = useState(window.innerWidth - 16);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLocation, setCurrentLocation] = useState<string | number>(0);
  const [rendition, setRendition] = useState<any>(null);
  const [showUI, setShowUI] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false); // ✅ state menu
  const [toc, setToc] = useState<{ label: string; href: string }[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  const navigate = useNavigate();

  /** 📌 Restore progress */
  useEffect(() => {
    if (!book || !userId) return;
    if (book.fileType === "pdf") {
      let restored = parseInt(localStorage.getItem(`book-${book.id}-page`) || "1", 10);
      setCurrentPage(restored);
    } else if (book.fileType === "epub") {
      let restoredLoc = localStorage.getItem(`book-${book.id}-location`) || "0";
      setCurrentLocation(restoredLoc);
    }
  }, [book, userId]);

  /** 📌 Save progress */
  const saveProgress = (page?: number, location?: string | number) => {
    if (!userId) return;
    if (book.fileType === "pdf" && page) {
      localStorage.setItem(`book-${book.id}-page`, String(page));
      axios.post(API.read, { bookId: book.id, lastPage: page }, { headers: { Authorization: `Bearer ${accessToken}` } });
    } else if (book.fileType === "epub" && location) {
      localStorage.setItem(`book-${book.id}-location`, String(location));
      axios.post(API.read, { bookId: book.id, lastLocation: location }, { headers: { Authorization: `Bearer ${accessToken}` } });
    }
  };

  /** 📌 Chuyển trang PDF */
  const handlePageChange = (offset: number) => {
    const newPage = currentPage + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
      saveProgress(newPage, undefined);
    }
  };

  /** 📌 Swipe handlers */
  const handlers = useSwipeable({
    onSwipedLeft: () => (book.fileType === "pdf" ? handlePageChange(1) : rendition?.next()),
    onSwipedRight: () => (book.fileType === "pdf" ? handlePageChange(-1) : rendition?.prev()),
    trackMouse: true,
  });

  return (
    <div className="fixed inset-0 bg-white z-[9999]" {...handlers} onClick={() => setShowUI((prev) => !prev)}>
      {/* Header */}
      {showUI && (
        <div className="absolute top-0 left-0 right-0 p-3 bg-black/70 text-white flex items-center justify-between z-50">
          <div className="flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(-1);
              }}
              className="text-2xl mr-3"
            >
              <FiChevronLeft />
            </button>
            <h2 className="truncate font-semibold">{book?.name}</h2>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(true);
            }}
            className="text-2xl"
          >
            <FiMenu />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="w-full h-full relative">
        {book.fileType === "pdf" ? (
          <Document
            file={book.fileUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<div className="text-center">Đang tải file PDF...</div>}
            noData={<div className="text-center text-red-600">⚠ Không tìm thấy file PDF.</div>}
          >
            <PdfPageWrapper pageNumber={currentPage} pageWidth={pageWidth} fitMode="height" />
          </Document>
        ) : book.fileType === "epub" ? (
          <EpubReaderWrapper
            fileUrl={book.fileUrl}
            bookId={book.id}
            location={currentLocation}
            onLocationChange={(loc) => {
              setCurrentLocation(loc);
              saveProgress(undefined, loc);
            }}
            fontSize={16}
            fontFamily="Mặc định"
            background="#ffffff"
            scrollMode={false}
            viewMode="single"
            onReady={(rend, tocData, noteData) => {
              setRendition(rend);
              setToc(tocData);
              setNotes(noteData);
              rend.on("relocated", (location: any) => {
                if (location && location.start?.percentage) {
                  setProgress(Math.round(location.start.percentage * 100));
                }
              });
            }}
            onNotesLoaded={(loadedNotes) => setNotes(loadedNotes)}
          />
        ) : (
          <div className="text-center text-red-600">❌ Định dạng {book.fileType} chưa được hỗ trợ.</div>
        )}
      </div>

      {/* Footer */}
      {showUI && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-1 rounded text-sm">
          {book.fileType === "pdf"
            ? `Trang ${currentPage} / ${numPages}`
            : `Tiến độ: ${progress}%`}
        </div>
      )}

      {/* Menu (TOC + Notes) */}
      {showMenu && (
        <ReaderMenu
          toc={toc}
          notes={notes}
          onClose={() => setShowMenu(false)}
          onSelectChapter={(href) => rendition?.display(href)}
          onSelectNote={(cfi) => rendition?.display(cfi)}
        />
      )}
    </div>
  );
};

export default BookReaderMobile;
