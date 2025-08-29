import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, pdfjs } from "react-pdf";
import API from "../../services/API";
import Loading from "../common/Loading";
import type { Book } from "../../types/Book";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import axios from "axios";
import ViewModeSwitcher from "../common/ViewModeSwitcher";
import ZoomControls from "../common/ZoomControls";
import HighlightNotesPanel from "./HighlightNotesPanel";
import { FiChevronLeft } from "react-icons/fi";
import PdfPageWrapper from "../common/PdfPageWrapper";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

interface Highlight {
  page: number;
  rects: { x: number; y: number; w: number; h: number }[];
  color: string;
  text: string;
}

const BookReaderPage: React.FC = () => {
  const { slugAndId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const accessToken = localStorage.getItem("accessToken");
  const bookId = slugAndId?.split("-").slice(-1)[0];

  const [book, setBook] = useState<Book | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageWidth, setPageWidth] = useState<number>(600);
  const isMobile = window.innerWidth < 1024;
  const [viewMode, setViewMode] = useState<"double" | "scroll" | "single">(
    isMobile ? "single" : "double"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState<boolean>(false);

  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  // const [selectedText, setSelectedText] = useState<string>("");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLaptop, setIsLaptop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsLaptop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isLaptop && viewMode !== "single") {
      setViewMode("single");
    }
  }, [isLaptop, viewMode]);

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

        let restoredPage =
          parseInt(localStorage.getItem(`book-${matched.id}-page`) || "1", 10) || 1;

        if (userId) {
          try {
            const res = await axios.get(`${API.activities}/read/${matched.id}`, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            });
            const serverPage = res.data?.page;
            if (serverPage && serverPage > restoredPage) {
              restoredPage = serverPage;
              localStorage.setItem(`book-${matched.id}-page`, restoredPage.toString());
            } else if (serverPage && serverPage < restoredPage) {
              await axios.post(
                API.read,
                { bookId: matched.id, page: restoredPage },
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                  },
                }
              );
            }
          } catch (err) {
            console.error("Sync server error:", err);
          }
        }
        setCurrentPage(restoredPage);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [bookId, navigate, userId, accessToken]);

  useEffect(() => {
    if (viewMode === "scroll") {
      const el = document.getElementById(`page-${currentPage}`);
      if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }, [viewMode, currentPage]);

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

  useEffect(() => {
    if (viewMode !== "scroll") return;
    const container = document.getElementById("pdf-container");
    if (!container) return;

    const handleScroll = () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

      scrollTimeout.current = setTimeout(() => {
        const containerTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const containerMiddle = containerTop + containerHeight / 2;

        const pages = container.querySelectorAll(".pdf-page-item");

        let closestPage = currentPage;
        let closestDistance = Infinity;

        pages.forEach((pageEl, index) => {
          const el = pageEl as HTMLElement;
          const pageTop = el.offsetTop;
          const pageBottom = el.offsetTop + el.offsetHeight;
          const pageMiddle = (pageTop + pageBottom) / 2;

          const distance = Math.abs(containerMiddle - pageMiddle);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestPage = index + 1;
          }
        });

        if (closestPage !== currentPage) {
          setCurrentPage(closestPage);
          if (book) {
            localStorage.setItem(`book-${book.id}-page`, closestPage.toString());
            if (userId) {
              axios
                .post(API.read, { bookId: book.id, page: closestPage })
                .catch((err) => console.error("Save progress error:", err));
            }
          }
        }
      }, 200);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [viewMode, book, userId, currentPage]);

  /** 📌 Highlight */
  const handleHighlight = (color: string) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const rects = Array.from(range.getClientRects());

    const container = document.getElementById(`page-${currentPage}`);
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const newHighlight: Highlight = {
      page: currentPage,
      text: selection.toString(),
      color,
      rects: rects.map((r) => ({
        x: r.left - containerRect.left,
        y: r.top - containerRect.top,
        w: r.width,
        h: r.height,
      })),
    };

    setHighlights((prev) => [...prev, newHighlight]);
    selection.removeAllRanges();
  };


  const handlePageChange = async (offset: number) => {
    const step = viewMode === "double" ? 2 : 1;
    const newPage = currentPage + offset * step;

    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
      if (book) {
        localStorage.setItem(`book-${book.id}-page`, newPage.toString());
        if (userId) {
          try {
            await axios.post(
              API.read,
              { bookId: book.id, page: newPage },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
          } catch (error) {
            console.error("Save progress error:", error);
          }
        }
      }
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setPopupPos(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    // setSelectedText(selection.toString());
    setPopupPos({
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 40,
    });
  };
  useEffect(() => {
    const onFs = () => {
      const live = !!document.fullscreenElement;
      console.log("[BookReaderPage] fullscreenchange → live =", live);
      setIsFullscreen(live);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  /** 📌 UI */
  if (loading) return <Loading />;
  if (!book) return <div className="p-5 text-red-500">Không tìm thấy sách.</div>;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-3 bg-gray-100 shadow-md">
        <button
          onClick={() => {
            isFullscreen ? (document.exitFullscreen(), setIsFullscreen(false), navigate(-1)) : navigate(-1);
          }}
          className="text-gray-700 hover:text-red-500 text-2xl"
        >
          <FiChevronLeft />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 truncate max-w-[50%] text-center">
          {book?.name || "Đang tải..."}
        </h2>
        {isLaptop && (
          <div className="flex items-center gap-3">
            <ViewModeSwitcher mode={viewMode} onChange={setViewMode} />
            <ZoomControls isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen} />

            <button
              onClick={() => setShowNotesPanel(!showNotesPanel)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Notes
            </button>
          </div>
        )}
      </div>

      {showNotesPanel && <HighlightNotesPanel />}

      {/* PDF viewer */}
      <div
        id="pdf-container"
        onMouseUp={handleTextSelection}
        className={`flex-1 px-2 pb-2 relative z-[10000] w-full ${isMobile ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"}`}
      >
        {book.fileUrl ? (
          <Document
            file={book.fileUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={(error) => console.error("PDF load error:", error)}
            loading={<div className="text-center">Đang tải file PDF...</div>}
            noData={<div className="text-center text-red-600">⚠ Không tìm thấy file PDF.</div>}
          >
            <div className={`flex ${viewMode === "scroll" ? "flex-col" : "justify-center gap-4"}`}>
              {/* Scroll */}
              {viewMode === "scroll" &&
                Array.from({ length: numPages }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <PdfPageWrapper
                      key={pageNumber}
                      pageNumber={pageNumber}
                      pageWidth={pageWidth}
                      onTextSelect={handleTextSelection}
                      highlights={highlights.filter((h) => h.page === pageNumber)}
                    />
                  );
                })}

              {/* Double page */}
              {isLaptop && viewMode === "double" && (
                <div className="flex justify-center gap-6">
                  <PdfPageWrapper
                    pageNumber={currentPage}
                    pageWidth={pageWidth}
                    onTextSelect={handleTextSelection}
                    highlights={highlights.filter((h) => h.page === currentPage)}
                  />
                  {currentPage + 1 <= numPages && (
                    <PdfPageWrapper
                      pageNumber={currentPage + 1}
                      pageWidth={pageWidth}
                      onTextSelect={handleTextSelection}
                      highlights={highlights.filter((h) => h.page === currentPage + 1)}
                    />
                  )}
                </div>
              )}

              {/* Single page */}
              {viewMode === "single" && (
                <PdfPageWrapper
                  pageNumber={currentPage}
                  pageWidth={pageWidth}
                  isFullscreen={isFullscreen}
                  onTextSelect={handleTextSelection}
                  highlights={highlights.filter((h) => h.page === currentPage)}
                />
              )}
            </div>
            {!isLaptop && viewMode !== "scroll" && (
              <>
                <div
                  className="absolute left-0 top-0 h-full w-[80px] z-[15000]"
                  onClick={() => handlePageChange(-1)}
                />
                <div
                  className="absolute right-0 top-0 h-full w-[80px] z-[15000]"
                  onClick={() => handlePageChange(1)}
                />
              </>
            )}
          </Document>
        ) : (
          <div className="text-center text-red-600">⚠ Không tìm thấy file PDF.</div>
        )}
      </div>

      {/* Highlight popup */}
      {popupPos && (
        <div
          className="absolute bg-white border rounded shadow-lg p-2 flex gap-2 z-[20000]"
          style={{ top: popupPos.y, left: popupPos.x, transform: "translate(-50%, -100%)" }}
        >
          <button onClick={() => { handleHighlight("yellow"); setPopupPos(null); }} className="px-2 py-1 bg-yellow-300 rounded">🟨</button>
          <button onClick={() => { handleHighlight("pink"); setPopupPos(null); }} className="px-2 py-1 bg-pink-300 rounded">💖</button>
          <button onClick={() => { handleHighlight("lightblue"); setPopupPos(null); }} className="px-2 py-1 bg-blue-300 rounded">🔵</button>
        </div>
      )}

      {isLaptop && viewMode !== "scroll" && (
        <>
          {/* Prev button */}
          <button
            onClick={() => handlePageChange(-1)}
            disabled={currentPage === 1}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 
                 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 z-[20000]"
          >
            ◀
          </button>

          {/* Next button */}
          <button
            onClick={() => handlePageChange(1)}
            disabled={
              (viewMode === "double" && currentPage >= numPages - 1) ||
              (viewMode === "single" && currentPage >= numPages)
            }
            className="absolute right-2 top-1/2 transform -translate-y-1/2 
                 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 z-[20000]"
          >
            ▶
          </button>
        </>
      )}


      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-white/70 px-3 py-1 rounded shadow z-[15000]">
        Trang {currentPage} / {numPages}
      </div>
    </div>
  );
};

export default BookReaderPage;
