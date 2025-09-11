import React, { useEffect, useState } from "react";
import { Document } from "react-pdf";
import { useSwipeable } from "react-swipeable";
import axios from "axios";
import API from "../../services/API";
import type { Book } from "../../types/Book";

import PdfPageWrapper from "../common/PdfPageWrapper";
import EpubReaderWrapper from "../common/EpubReaderWrapper";
import ReaderHeader from "../common/ReaderHeader";
import FontMenu from "../common/FontMenuButton";
import ReaderMenu from "../common/ReaderMenu";
import ChapterProgress from "../common/ReadingProgressCircle";

interface Props {
  book: Book;
  userId: string | null;
  accessToken: string | null;
}

const BookReaderMobile: React.FC<Props> = ({ book, userId, accessToken }) => {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLocation, setCurrentLocation] = useState<string | number>(0);
  const [rendition, setRendition] = useState<any>(null);

  // UI
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Reader settings
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Mặc định");
  const [background, setBackground] = useState("#ffffff");
  const [toc, setToc] = useState<{ label: string; href: string }[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  const pageWidth = window.innerWidth - 30;

  /** 📌 Restore progress */
  useEffect(() => {
    if (!book || !userId) return;
    if (book.fileType === "pdf") {
      const restored = parseInt(localStorage.getItem(`book-${book.id}-page`) || "1", 10);
      setCurrentPage(restored);
    } else if (book.fileType === "epub") {
      const restoredLoc = localStorage.getItem(`book-${book.id}-location`) || "0";
      setCurrentLocation(restoredLoc);
    }
  }, [book, userId]);

  /** 📌 Save progress */
  const saveProgress = (page?: number, location?: string | number) => {
    if (!userId || !accessToken) return;
    if (book.fileType === "pdf" && page) {
      localStorage.setItem(`book-${book.id}-page`, String(page));
      axios.post(API.read, { bookId: book.id, lastPage: page }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } else if (book.fileType === "epub" && location) {
      localStorage.setItem(`book-${book.id}-location`, String(location));
      axios.post(API.read, { bookId: book.id, lastLocation: location }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  };

  /** 📌 Swipe handlers */
  const handlers = useSwipeable({
    onSwipedLeft: () => (book.fileType === "pdf" ? handlePageChange(1) : rendition?.next()),
    onSwipedRight: () => (book.fileType === "pdf" ? handlePageChange(-1) : rendition?.prev()),
    trackMouse: true,
  });

  /** 📌 Change PDF page */
  const handlePageChange = (offset: number) => {
    const newPage = currentPage + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
      saveProgress(newPage, undefined);
    }
  };
  useEffect(() => {
    if (!rendition) return;
    rendition.themes.fontSize(`${fontSize}px`);
    if (fontFamily === "Mặc định") {
      rendition.themes.override("font-family", "inherit");
    } else {
      rendition.themes.override("font-family", fontFamily);
    }
    rendition.themes.override("background", background);
    rendition.themes.override("color", background === "#000000" ? "#ffffff" : "#000000");
  }, [rendition, fontSize, fontFamily, background]);

  return (
    <div className="fixed inset-0 bg-white z-[99999] flex flex-col" {...handlers}>
      {/* Header */}
      <ReaderHeader
        book={book}
        bookName={book.name}
        isFullscreen={isFullscreen}
        setIsFullscreen={setIsFullscreen}
        onOpenFontMenu={() => setShowFontMenu((prev) => !prev)}
        onToggleToc={() => setShowMenu((prev) => !prev)}
      />

      {/* Font Menu */}
      {showFontMenu && (
        <div className="absolute right-0 top-[40px] z-[20000]">
          <FontMenu
            fontSize={fontSize}
            fontFamily={fontFamily}
            background={background}
            isMobile={true}
            scrollMode={false}
            onFontSizeChange={setFontSize}
            onFontChange={setFontFamily}
            onBackgroundChange={setBackground}
            onLayoutChange={() => { }} // mobile luôn single
            onScrollModeChange={() => { }} // mobile không cuộn
          />
        </div>
      )}

      {showMenu && (
        <ReaderMenu
          toc={toc}
          notes={notes}
          onClose={() => setShowMenu(false)}
          onSelectChapter={(href) => rendition?.display(href)}
          onSelectNote={(cfi) => rendition?.display(cfi)}
          isMobile={true}
        />
      )}

      {/* Content */}
      <div className="flex-1 relative">
        {book.fileType === "pdf" ? (
          <Document
            file={book.fileUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<div className="text-center">Đang tải PDF...</div>}
            noData={<div className="text-center text-red-600">⚠ Không tìm thấy file PDF.</div>}
          >
            <div className="relative left-[-30px] w-[400px] h-[535px] mx-auto">
              <PdfPageWrapper
                pageNumber={currentPage}
                pageWidth={pageWidth}
                fitMode="height"
              />
            </div>
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
            fontSize={fontSize}
            fontFamily={fontFamily}
            background={background}
            scrollMode={false}
            viewMode="single"
            onReady={(rend, tocData, noteData) => {
              setRendition(rend);
              setToc(tocData);
              setNotes(noteData);
            }}
            onNotesLoaded={(loadedNotes) => setNotes(loadedNotes)}
          />
        ) : (
          <div className="text-center text-red-600">❌ Định dạng {book.fileType} chưa hỗ trợ.</div>
        )}
      </div>

      {/* Footer */}
      {book.fileType === "pdf" ? (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded">
          Trang {currentPage} / {numPages}
        </div>
      ) : (
        <ChapterProgress rendition={rendition} />
      )}
    </div>
  );
};

export default BookReaderMobile;
