import React, { useState, useEffect } from "react";
import { Document } from "react-pdf";
import PdfPageWrapper from "../common/PdfPageWrapper";
import type { Book } from "../../types/Book";
import { FiChevronLeft } from "react-icons/fi";
import API from "../../services/API";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Highlight {
    page: number;
    rects: { x: number; y: number; w: number; h: number }[];
    color: string;
    text: string;
}

interface Props {
    book: Book;
    currentPage: number;
    setCurrentPage: (p: number) => void;
    numPages: number;
    setNumPages: (n: number) => void;
    highlights: Highlight[];
    setHighlights: React.Dispatch<React.SetStateAction<Highlight[]>>;
    userId: string | null;
    accessToken: string | null;
}

const BookReaderMobile: React.FC<Props> = ({
    book,
    currentPage,
    setCurrentPage,
    numPages,
    setNumPages,
    highlights,
    setHighlights,
    userId,
    accessToken,
}) => {
    const [pageWidth] = useState(window.innerWidth - 16);
    const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
    const navigate = useNavigate();
    useEffect(() => {
        if (!book || !userId) return;
        let restoredPage =
            parseInt(localStorage.getItem(`book-${book.id}-page`) || "1", 10) || 1;

        axios
            .get(`${API.activities}/read/${book.id}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            .then((res) => {
                const serverPage = res.data?.page;
                if (serverPage && serverPage > restoredPage) {
                    setCurrentPage(serverPage);
                    localStorage.setItem(`book-${book.id}-page`, serverPage.toString());
                } else {
                    setCurrentPage(restoredPage);
                }
            })
            .catch(() => setCurrentPage(restoredPage));
    }, [book, userId, setCurrentPage]);

    /** 📌 Chuyển trang */
    const handlePageChange = (offset: number) => {
        const newPage = currentPage + offset;
        if (newPage >= 1 && newPage <= numPages) {
            setCurrentPage(newPage);
            localStorage.setItem(`book-${book.id}-page`, newPage.toString());
            if (userId) {
                axios
                    .post(
                        API.read,
                        { bookId: book.id, page: newPage },
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${accessToken}`,
                            },
                        }
                    )
                    .catch((err) => console.error("Save progress error:", err));
            }
        }
    };

    /** 📌 Chọn text */
    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setPopupPos(null);
            return;
        }
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setPopupPos({
            x: rect.left + rect.width / 2,
            y: rect.top + window.scrollY - 40,
        });
    };

    useEffect(() => {
        const enterFullscreen = async () => {
            try {
                await document.documentElement.requestFullscreen?.();
            } catch (err) {
                console.error("Không thể bật fullscreen:", err);
            }
        };

        // chỉ auto fullscreen khi là mobile
        if (window.innerWidth < 1024) {
            enterFullscreen();
        }

        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen?.();
            }
        };
    }, []);
    /** 📌 Highlight */
    const handleHighlight = (color: string) => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const range = selection.getRangeAt(0);
        const rects = Array.from(range.getClientRects());

        const container = document.getElementById(`page-${currentPage}`);
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const canvas = container.querySelector("canvas") as HTMLCanvasElement;
        if (!canvas) return;

        // scale theo canvas để highlight đúng trên mobile
        const scaleX = canvas.width / canvas.getBoundingClientRect().width;
        const scaleY = canvas.height / canvas.getBoundingClientRect().height;

        setHighlights((prev) => [
            ...prev,
            {
                page: currentPage,
                color,
                text: selection.toString(),
                rects: rects.map((r) => ({
                    x: (r.left - containerRect.left) * scaleX,
                    y: (r.top - containerRect.top) * scaleY,
                    w: r.width * scaleX,
                    h: r.height * scaleY,
                })),
            },
        ]);

        selection.removeAllRanges();
        setPopupPos(null);
    };


    return (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-gray-100 shadow-md">
                <button
                    onClick={() => navigate(-1)}
                    className="text-gray-700 hover:text-red-500 text-2xl"
                >
                    <FiChevronLeft />
                </button>
                <h2 className="text-base font-semibold text-gray-800 truncate max-w-[70%] text-center">
                    {book?.name || "Đang tải..."}
                </h2>
                <div className="w-6" /> {/* để cân đối */}
            </div>

            {/* PDF Viewer */}
            <div
                id="pdf-container"
                onMouseUp={handleTextSelection}
                className="w-full h-[calc(100vh-96px)] relative overflow-hidden"

            >
                {book.fileUrl ? (
                    <Document
                        file={book.fileUrl}
                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        loading={<div className="text-center">Đang tải file...</div>}
                        noData={
                            <div className="text-center text-red-600">
                                ⚠ Không tìm thấy file PDF.
                            </div>
                        }
                    >
                        <PdfPageWrapper
                            pageNumber={currentPage}
                            pageWidth={pageWidth}
                            fitMode="height"
                            onTextSelect={handleTextSelection}
                            highlights={highlights.filter((h) => h.page === currentPage)}
                        />
                    </Document>
                ) : (
                    <div className="text-center text-red-600">
                        ⚠ Không tìm thấy file PDF.
                    </div>
                )}

                {/* Tap trái/phải đổi trang */}
                <div
                    className="absolute left-0 top-0 h-full w-[10%] z-[15000]"
                    onClick={() => handlePageChange(-1)}
                />
                <div
                    className="absolute right-0 top-0 h-full w-[10%] z-[15000]"
                    onClick={() => handlePageChange(1)}
                />
            </div>

            {/* Popup highlight */}
            {popupPos && (
                <div
                    className="absolute bg-white border rounded shadow-lg p-2 flex gap-2"
                    style={{
                        top: popupPos.y,
                        left: popupPos.x,
                        transform: "translate(-50%, -100%)",
                    }}
                >
                    <button
                        onClick={() => handleHighlight("yellow")}
                        className="px-2 py-1 bg-yellow-300 rounded"
                    >
                        🟨
                    </button>
                    <button
                        onClick={() => handleHighlight("pink")}
                        className="px-2 py-1 bg-pink-300 rounded"
                    >
                        💖
                    </button>
                    <button
                        onClick={() => handleHighlight("lightblue")}
                        className="px-2 py-1 bg-blue-300 rounded"
                    >
                        🔵
                    </button>
                </div>
            )}

            {/* Footer */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/70 px-3 py-1 rounded shadow">
                Trang {currentPage} / {numPages}
            </div>
        </div>
    );
};

export default BookReaderMobile;
