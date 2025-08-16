import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import API from "../services/API";
import Loading from "./Loading";
import type { Book } from "../types/Book";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import axios from "axios";

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
  const [screenType, setScreenType] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );
  const [isLightOff, setIsLightOff] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pageWidth, setPageWidth] = useState<number>();

  /** 📌 Detect screen size */
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenType("mobile");
      else if (width < 1024) setScreenType("tablet");
      else setScreenType("desktop");
    };
    detectDevice();
    window.addEventListener("resize", detectDevice);
    return () => window.removeEventListener("resize", detectDevice);
  }, []);

  /** 📌 Fetch book info + Restore progress */
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);

        // Lấy danh sách sách
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
          parseInt(localStorage.getItem(`book-${matched.id}-page`) || "1", 10) ||
          1;
        console.log("📂 LocalStorage restore:", restoredPage);
        if (userId) {
          try {
            const res = await axios.get(`${API.activities}/read/${matched.id}`, {
              headers: { "x-user-id": userId },
            });
            const serverPage = res.data?.page;
            console.log("🌐 Server restore:", serverPage);

            if (serverPage && serverPage > restoredPage) {
              restoredPage = serverPage;
              localStorage.setItem(
                `book-${matched.id}-page`,
                restoredPage.toString()
              );
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

  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById("pdf-container");
      if (container) {
        const style = getComputedStyle(container);
        const paddingLeft = parseInt(style.paddingLeft, 10);
        const paddingRight = parseInt(style.paddingRight, 10);
        const innerWidth =
          container.clientWidth - paddingLeft - paddingRight - 8;
        setPageWidth(Math.max(innerWidth, 0));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /** 📌 Handle page navigation */
  const handlePageChange = async (offset: number) => {
    const step = screenType === "desktop" ? 2 : 1;
    const newPage = currentPage + offset * step;

    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);

      if (book) {
        // Lưu localStorage
        localStorage.setItem(`book-${book.id}-page`, newPage.toString());

        // Gửi lên server nếu có login
        if (userId) {
          try {
            await axios.post(
              API.read,
              { bookId: book.id, page: newPage },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                  "ngrok-skip-browser-warning": "true",
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

  /** 📌 Login modal */
  if (showLoginModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
          <h2 className="text-lg font-semibold mb-4">
            Bạn cần đăng nhập để xem chi tiết sách
          </h2>
          <button
            onClick={() => navigate("/login")}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  /** 📌 UI render */
  if (loading) return <Loading />;
  if (!book) return <div className="p-5 text-red-500">Không tìm thấy sách.</div>;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col">
      {/* Top bar */}
      <div className="p-5">
        <button
          onClick={() => navigate(-1)}
          className="mb-2 bg-red-500 text-white px-3 py-2 rounded cursor-pointer"
        >
          Đóng
        </button>
        <button
          onClick={() => setIsLightOff(!isLightOff)}
          className={`ml-4 px-3 py-2 rounded ${isLightOff ? "bg-yellow-500" : "bg-gray-800 text-white"
            }`}
        >
          {isLightOff ? "Bật đèn" : "Tắt đèn"}
        </button>
      </div>

      {/* PDF viewer */}
      <div
        id="pdf-container"
        className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-5 relative z-[10000] w-full"
      >
        {book.fileUrl ? (
          <Document
            file={book.fileUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={(error) => console.error("PDF load error:", error)}
            loading={<div className="text-center">Đang tải file PDF...</div>}
            noData={
              <div className="text-center text-red-600">
                ⚠ Không tìm thấy file PDF.
              </div>
            }
          >
            <div className="flex justify-center items-start gap-4 w-full overflow-hidden">
              <Page
                className="border border-gray-300 rounded-md shadow-sm"
                pageNumber={currentPage}
                width={pageWidth}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
              {screenType === "desktop" && currentPage + 1 <= numPages && (
                <Page
                  className="border border-gray-300 rounded-md shadow-sm"
                  pageNumber={currentPage + 1}
                  width={pageWidth}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              )}
            </div>
          </Document>
        ) : (
          <div className="text-center text-red-600">
            ⚠ Không tìm thấy file PDF.
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => handlePageChange(-1)}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            ◀ Trang trước
          </button>
          <span>
            Trang {currentPage} / {numPages}
          </span>
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage >= numPages}
            className="px-3 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Trang sau ▶
          </button>
        </div>
      </div>

      {/* Overlay tắt đèn */}
      {isLightOff && (
        <div className="fixed inset-0 bg-black opacity-70 z-[9998] pointer-events-none"></div>
      )}
    </div>
  );
};

export default BookReaderPage;
