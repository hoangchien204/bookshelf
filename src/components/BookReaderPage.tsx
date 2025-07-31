import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import API from '../services/API';

import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import axios from 'axios';
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

interface Book {
  id: string;
  name: string;
  author: string;
  description?: string;
  genre?: string;
  coverUrl: string;
  fileUrl: string;
}

const BookReaderPage: React.FC = () => {
  const { slugAndId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const [book, setBook] = useState<Book | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [screenType, setScreenType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  const bookId = slugAndId?.split('-').slice(-1)[0];
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenType('mobile');
      else if (width < 1024) setScreenType('tablet');
      else setScreenType('desktop');
    };
    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const res = await fetch(API.books, {
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        const allBooks: Book[] = await res.json();

        const matched = allBooks.find((b) => b.id.includes(bookId || ''));
        if (!matched) {
          navigate('/');
          return;
        }

        setBook(matched);
      } catch (err) {
        console.error('❌ Lỗi khi lấy sách:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId, navigate]);

  const handlePageChange = async (offset: number) => {
    let step = 1;
    screenType === 'desktop' ? step = 2 : step = 1;
    const newPage = currentPage + offset * step;
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
      if (book) {
        localStorage.setItem(`book-${book.id}-page`, newPage.toString());


        if (userId) {
          try {
            await axios.post(API.read, {
              bookId: book.id,
              page: newPage,
            }, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                'ngrok-skip-browser-warning': 'true',
              }
            });

          } catch (error) {
            console.error('❌ Gửi hoạt động đọc thất bại:', error);
          }
        }
      }
    }
  };

  useEffect(() => {
    const fetchReadingProgress = async () => {
      try {
        if (!book?.id || book.id === 'undefined') {
          return;
        }

        const res = await axios.get(`${API.activities}/read/${book.id}`, {
          headers: {
            'x-user-id': userId,
          },
        });
        const lastPage = res.data.page;
        setCurrentPage(lastPage);
      } catch (err) {
        console.error('Lỗi lấy trạng thái đọc:', err);

      }
    };

    fetchReadingProgress();
  }, [book?.id, userId]);
  if (loading) return <div className="p-5">📖 Đang tải sách...</div>;
  if (!book) return <div className="p-5 text-red-500">❌ Không tìm thấy sách.</div>;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col">
      <div className="p-5">
        <button
          onClick={() => navigate(-1)}
          className="mb-2 bg-red-500 text-white px-3 py-2 rounded cursor-pointer"
        >
          Đóng
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {book.fileUrl ? (
          <Document
            file={book.fileUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={(error) => console.error("PDF load error:", error)}
            loading={<div className="text-center">Đang tải file PDF...</div>}
            noData={<div className="text-center text-red-600">⚠ Không tìm thấy file PDF.</div>}
          >
            <div className="flex justify-center items-start gap-4 overflow-x-auto">
              <Page
                className="border border-gray-300 rounded-md shadow-sm"
                pageNumber={currentPage}
                width={
                  screenType === 'mobile' ? 380 :
                    screenType === 'tablet' ? 520 :
                      650
                }
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              {screenType === 'desktop' && currentPage + 1 <= numPages && (
                <Page
                  className="border border-gray-300 rounded-md shadow-sm"
                  pageNumber={currentPage + 1}
                  width={650}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              )}
            </div>
          </Document>
        ) : (
          <div className="text-center text-red-600">⚠ Không tìm thấy file PDF.</div>
        )}

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
    </div>

  );
};

export default BookReaderPage;
