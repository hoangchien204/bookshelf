import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import API from "../../services/API";
import Loading from "../common/Loading";
import type { Book } from "../../types/Book";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import axios from "axios";
import ViewModeSwitcher from "../common/ViewModeSwitcher";
import ZoomControls from "../common/ZoomControls";
import HighlightNotesPanel from "./HighlightNotesPanel";
import { FiChevronLeft, FiEdit } from "react-icons/fi";
import PdfPageWrapper from "../common/PdfPageWrapper";

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
  const [loading, setLoading] = useState(true);
  const [pageWidth, setPageWidth] = useState<number>(600);
  const isMobile = window.innerWidth < 1024;
  const [viewMode, setViewMode] = useState<"double" | "scroll" | "single">(
    isMobile ? "single" : "double"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState<boolean>(false);
  const [highlightMode, setHighlightMode] = useState(false);

  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number, y: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  // ✅ Xác định laptop hay mobile
  const [isLaptop, setIsLaptop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsLaptop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Nếu không phải laptop → ép về single
  useEffect(() => {
    if (!isLaptop && viewMode !== "single") {
      setViewMode("single");
    }
  }, [isLaptop, viewMode]);

  /** 📌 Fetch book */
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        if (!userId || !accessToken) {
          return;
        }
        const res = await fetch(API.books, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
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
              headers: { "x-user-id": userId },
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
                    "x-user-id": userId,
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

  /** 📌 Auto scroll đến page khôi phục */
  useEffect(() => {
    if (viewMode === "scroll") {
      const el = document.getElementById(`page-${currentPage}`);
      if (el) {
        el.scrollIntoView({ behavior: "auto", block: "start" });
      }
    }
  }, [viewMode, currentPage]);

  /** 📌 Resize container */
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

  /** 📌 Scroll detection để cập nhật currentPage */
  useEffect(() => {
    if (viewMode !== "scroll") return;
    const container = document.getElementById("pdf-container");
    if (!container) return;

    const handleScroll = () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

      scrollTimeout.current = setTimeout(() => {
        if (!container) return;

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

          // khoảng cách giữa tâm container và tâm page
          const distance = Math.abs(containerMiddle - pageMiddle);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestPage = index + 1;
          }
        });

        if (closestPage !== currentPage) {
          console.log(`📖 Update currentPage: ${currentPage} -> ${closestPage}`);
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
      }, 200); // debounce 0.2s
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [viewMode, book, userId, currentPage]);
  const handleHighlight = (color: string) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();

    // tạo 1 overlay layer nếu chưa có
    let overlay = document.getElementById("svg-highlight-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "svg-highlight-overlay";
      overlay.style.position = "absolute";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.pointerEvents = "none"; // để không block click
      overlay.style.zIndex = "1000";
      document.body.appendChild(overlay);
    }

    Array.from(rects).forEach((r) => {
      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.left = r.left + window.scrollX + "px";
      div.style.top = r.top + window.scrollY + "px";
      div.style.width = r.width + "px";
      div.style.height = r.height + "px";
      div.style.backgroundColor = color;
      div.style.opacity = "0.4";
      div.style.borderRadius = "2px";
      overlay!.appendChild(div);
    });

    selection.removeAllRanges();
  };

  /** 📌 Lưu khi chuyển trang (single/double) */
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

    setSelectedText(selection.toString());
    setPopupPos({
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 40,
    });
  };

  /** 📌 UI render */
  if (loading) return <Loading />;
  if (!book) return <div className="p-5 text-red-500">Không tìm thấy sách.</div>;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col">
      
      <div className="flex justify-between items-center p-3 bg-gray-100 shadow-md">
        <button
          onClick={() => {
            {
              isFullscreen ? (document.exitFullscreen(), setIsFullscreen(false), navigate(-1))
                : navigate(-1);
            }
          }}
          className="text-gray-700 hover:text-red-500 text-2xl"
        >
          <FiChevronLeft />
        </button>

        {/* tên sách */}
        <h2 className="text-lg font-semibold text-gray-800 truncate max-w-[50%] text-center">
          {book?.name || "Đang tải..."}
        </h2>

        {/* 3 chức năng: chỉ hiện khi laptop */}
        {isLaptop && (
          <div className="flex items-center gap-3">
            <ViewModeSwitcher mode={viewMode} onChange={setViewMode} />
            <ZoomControls isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen} />
            <button
              onClick={() => setHighlightMode(!highlightMode)}
              className={`px-3 py-2 rounded flex items-center gap-2 transition ${highlightMode ? "bg-pink-500 text-white" : "bg-gray-200 text-gray-700"
                }`}
            >
              <FiEdit className="text-lg" />
            </button>
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
        className={`flex-1 px-2 pb-2 relative z-[10000] w-full
    ${isMobile ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"}`}
      >
        {book.fileUrl ? (
          <Document
            file={book.fileUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={(error) => console.error("PDF load error:", error)}
            loading={<div className="text-center">Đang tải file PDF...</div>}
            noData={<div className="text-center text-red-600">⚠ Không tìm thấy file PDF.</div>}
          >
            <div
              className={`flex ${viewMode === "scroll" ? "flex-col" : "justify-center gap-4"
                }`}
            >
              {/* Scroll mode */}
              {viewMode === "scroll" &&
                Array.from({ length: numPages }, (_, i) => {
                  const pageNumber = i + 1;
                  const BUFFER = 3;

                  if (Math.abs(pageNumber - currentPage) > BUFFER) {
                    return (
                      <div
                        key={pageNumber}
                        id={`page-${pageNumber}`}
                        className="pdf-page-item border border-gray-300 rounded-md shadow-sm mb-4 bg-gray-100 text-gray-400 flex items-center justify-center"
                        style={{ height: `${pageWidth * 1.414}px` }}
                      >
                        Trang {pageNumber}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={pageNumber}
                      id={`page-${pageNumber}`}
                      className="pdf-page-item border border-gray-300 rounded-md shadow-sm mb-4 relative"
                    >
                      <Page
                        pageNumber={pageNumber}
                        width={pageWidth}
                        renderTextLayer
                        renderAnnotationLayer
                      />
                    </div>
                  );
                })}

              {/* Double page: chỉ laptop */}
              {isLaptop && viewMode === "double" && (
                <>
                  <div className="flex justify-center gap-6">
                    <div className="relative">
                      <Page pageNumber={currentPage} width={pageWidth} />
                    </div>
                    {currentPage + 1 <= numPages && (
                      <div className="relative">
                        <Page pageNumber={currentPage + 1} width={pageWidth} />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Single page */}
              {viewMode === "single" && (
                <PdfPageWrapper
                  pageNumber={currentPage}
                  pageWidth={pageWidth}
                  highlightMode={highlightMode}
                  onTextSelect={handleTextSelection}
                />
              )}

            </div>
          </Document>
        ) : (
          <div className="text-center text-red-600">⚠ Không tìm thấy file PDF.</div>
        )}

        {/* Footer controls */}
        <div className="flex justify-between items-center mt-6 relative z-[10002]">
          {viewMode !== "scroll" ? (
            <>
              <button
                onClick={() => handlePageChange(-1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                ◀ Trang trước
              </button>

              <span>
                {viewMode === "double"
                  ? `Trang ${currentPage}-${Math.min(currentPage + 1, numPages)} / ${numPages}`
                  : `Trang ${currentPage} / ${numPages}`}
              </span>

              <button
                onClick={() => handlePageChange(1)}
                disabled={
                  viewMode === "double"
                    ? currentPage >= numPages - 1
                    : currentPage >= numPages
                }
                className="px-3 py-2 bg-gray-300 rounded disabled:opacity-50"
              >
                Trang sau ▶
              </button>
            </>
          ) : (
            <span className="mx-auto">Trang {currentPage} / {numPages}</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {viewMode === "scroll" && (
        <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-[10001]">
          <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden pointer-events-none">
            <div
              className="h-full bg-blue-500 transition-all duration-200"
              style={{ width: `${(currentPage / numPages) * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 bg-white/80 px-2 py-0.5 rounded shadow">
            Trang {currentPage} / {numPages}
          </span>
        </div>
      )}

      {popupPos && (
        <div
          className="absolute bg-white border rounded shadow-lg p-2 flex gap-2 z-[20000]"
          style={{
            top: popupPos.y,
            left: popupPos.x,
            transform: "translate(-50%, -100%)",
          }}
        >
          <button
            className="px-2 py-1 bg-yellow-300 rounded"
            onClick={() => {
              handleHighlight("yellow");
              setPopupPos(null);
            }}
          >
            🟨
          </button>
          <button
            className="px-2 py-1 bg-pink-300 rounded"
            onClick={() => {
              handleHighlight("pink");
              setPopupPos(null);
            }}
          >
            💖
          </button>
          <button
            className="px-2 py-1 bg-blue-300 rounded"
            onClick={() => {
              handleHighlight("lightblue");
              setPopupPos(null);
            }}
          >
            🔵
          </button>
          <button
            className="px-2 py-1 bg-gray-200 rounded"
            onClick={() => {
              alert(`Ghi chú: "${selectedText}"`);
              setPopupPos(null);
            }}
          >
            📝
          </button>
        </div>
      )}
    </div>
  );
};

export default BookReaderPage;
