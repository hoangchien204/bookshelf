import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, pdfjs } from "react-pdf";
import API from "../../services/API";
import Loading from "../common/Loading";
import type { Book } from "../../types/Book";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import axios from "axios";
import PdfPageWrapper from "../common/PdfPageWrapper";
import EpubReaderWrapper from "../common/EpubReaderWrapper";
import ReaderHeader from "../common/ReaderHeader";
import FontMenu from "../common/FontMenuButton";
import ReaderMenu from "../common/ReaderMenu";
import ChapterProgress from "../common/ReadingProgressCircle";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

const BookReaderPage: React.FC = () => {
  const { slugAndId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const accessToken = localStorage.getItem("accessToken");
  const bookId = slugAndId?.split("-").slice(-1)[0];

  const [book, setBook] = useState<Book | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentLocation, setCurrentLocation] = useState<string | number>(0);
  const [loading, setLoading] = useState(true);
  const [pageWidth, setPageWidth] = useState<number>(600);

  const isMobile = window.innerWidth < 768;
  const [viewMode, setViewMode] = useState<"double" | "single">(
    isMobile ? "single" : "double"
  );
  const [scrollMode, setScrollMode] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);

  //  Menu state
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false)
  //  Reader settings
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Mặc định");
  const [background, setBackground] = useState("#ffffff");
  //show menu
  const [toc, setToc] = useState<{ label: string; href: string }[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [rendition, setRendition] = useState<any>(null);
  /**Resize handler */
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById("pdf-container");
      if (container) {
        const innerWidth = container.clientWidth - 4;
        setPageWidth(Math.max(innerWidth, 0));
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  /** 📌 Fetch book + restore progress */
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        if (!userId || !accessToken) return;
        const res = await fetch(API.books);
        const allBooks: Book[] = await res.json();
        const matched = allBooks.find((b) => b.id.includes(bookId || ""));
        if (!matched) {
          navigate("/");
          return;
        }
        setBook(matched);

        if (matched.fileType === "pdf") {
          let restoredPage =
            parseInt(localStorage.getItem(`book-${matched.id}-page`) || "1", 10) || 1;

          if (userId) {
            try {
              const res = await axios.get(`${API.activities}/read/${matched.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              const serverPage = res.data?.lastPage;
              if (serverPage && serverPage > restoredPage) {
                restoredPage = serverPage;
                localStorage.setItem(`book-${matched.id}-page`, restoredPage.toString());
              }
            } catch (err) {
              console.error("Sync server error:", err);
            }
          }
          setCurrentPage(restoredPage);
        } else if (matched.fileType === "epub") {
          let restoredLocation =
            localStorage.getItem(`book-${matched.id}-location`) || "0";

          if (userId) {
            try {
              const res = await axios.get(`${API.activities}/read/${matched.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              const serverLocation = res.data?.lastLocation;
              if (serverLocation) {
                restoredLocation = serverLocation;
                localStorage.setItem(`book-${matched.id}-location`, restoredLocation);
              }
            } catch (err) {
              console.error("Sync server error:", err);
            }
          }
          setCurrentLocation(restoredLocation);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [bookId, navigate, userId, accessToken]);

  /** 📌 Change PDF page manually */
  const handlePageChange = async (offset: number) => {
    const step = viewMode === "double" ? 2 : 1;
    let newPage = currentPage + offset * step;

    if (viewMode === "double" && newPage % 2 === 0) {
      newPage -= 1; // đảm bảo luôn số lẻ
    }

    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
      if (book) {
        localStorage.setItem(`book-${book.id}-page`, newPage.toString());
        if (userId) {
          try {
            await axios.post(
              API.read,
              { bookId: book.id, page: newPage },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
          } catch (error) {
            console.error("Save progress error:", error);
          }
        }
      }
    }
  };
  const handleDeleteNote = async (id: string) => {
    try {
      const note = notes.find((n) => n.id === id);
      if (!note) return;

      rendition?.annotations.remove(note.cfiRange, "highlight");

      await axios.delete(`${API.highlights}/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("❌ Delete highlight error:", err);
    }
  };

  /** 📌 Fullscreen handler */
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  /** 📌 UI */
  if (loading) return <Loading />;
  if (!book) return <div className="p-5 text-red-500">Không tìm thấy sách.</div>;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col ">
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
            scrollMode={scrollMode}
            isMobile={false}
            onFontSizeChange={setFontSize}
            onFontChange={setFontFamily}
            onBackgroundChange={setBackground}
            onLayoutChange={(layout) => setViewMode(layout)}
            onScrollModeChange={(scroll) => setScrollMode(scroll)}
          />
        </div>
      )}
      {/* Show Menu */}
      {showMenu && (
        <ReaderMenu
          toc={toc}
          notes={notes}
          onClose={() => setShowMenu(false)}
          onSelectChapter={(href) => rendition?.display(href)}
          onSelectNote={(cfi) => rendition?.display(cfi)}
          isMobile={false}
          onDeleteNote={handleDeleteNote}
        />
      )}


      {/* Content */}
      <div
        id="book-container"
        className={`flex-1  relative z-[100] w-full ${isMobile ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
          }`}
      >
        {book.fileUrl ? (
          book.fileType === "pdf" ? (
            <Document
              file={book.fileUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={(error) => console.error("PDF load error:", error)}
              loading={<div className="text-center">Đang tải file PDF...</div>}
              noData={<div className="text-center text-red-600">⚠ Không tìm thấy file PDF.</div>}
            >
              <div className="flex justify-center gap-6">

                <PdfPageWrapper
                  pageNumber={currentPage}
                  pageWidth={pageWidth} />

                {currentPage + 1 <= numPages && (
                  <PdfPageWrapper
                    pageNumber={currentPage + 1}
                    pageWidth={pageWidth} />
                )}
              </div>
            </Document>

          ) : book.fileType === "epub" ? (
            <EpubReaderWrapper
              fileUrl={book.fileUrl}
              bookId={book.id}
              location={currentLocation}
              onLocationChange={(loc) => {
                setCurrentLocation(loc);
                localStorage.setItem(`book-${book.id}-page`, String(loc));
                if (userId) {
                  axios
                    .post(
                      API.read,
                      { bookId: book.id, lastLocation: loc },
                      { headers: { Authorization: `Bearer ${accessToken}` } }
                    )
                    .catch((err) => console.error("Save EPUB progress error:", err));
                }
              }}
              fontSize={fontSize}
              fontFamily={fontFamily}
              background={background}
              scrollMode={scrollMode}
              viewMode={viewMode}
              onReady={(rend, tocData, noteData) => {
                setRendition(rend);
                setToc(tocData);
                setNotes(noteData);
              }}
              onNotesLoaded={(loadedNotes) => setNotes(loadedNotes)}

            />
          ) : (
            <div className="text-center text-red-600">
              ❌ Định dạng {book.fileType} chưa được hỗ trợ.
            </div>
          )
        ) : (
          <div className="text-center text-red-600">⚠ Không tìm thấy file.</div>
        )}
      </div>

      {/* Footer PDF */}
      {book?.fileType === "pdf" && (
        <>
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 
                          bg-white/70 px-3 py-1 rounded shadow z-[15000]">
            Trang {currentPage} / {numPages}
          </div>
          <button
            onClick={() => handlePageChange(-1)}
            disabled={currentPage === 1}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 
                       bg-black/40 hover:bg-black/60 text-white rounded-full p-3 z-[20000]"
          >
            ◀
          </button>
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage >= numPages}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 
                       bg-black/40 hover:bg-black/60 text-white rounded-full p-3 z-[20000]"
          >
            ▶
          </button>
        </>
      )}
      {book.fileType === "epub" && (
        <ChapterProgress rendition={rendition} />
      )}
    </div>
  );
};

export default BookReaderPage;
