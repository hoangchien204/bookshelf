import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, pdfjs } from "react-pdf";
import { motion } from "framer-motion";
import type { Book } from "../../types/Book";
import ChapterProgress from "../common/ReadingProgressCircle";
import LoginModal from "../../screens/login";
import Loading from "../common/Loading";
import EpubReaderWrapper from "../common/EpubReaderWrapper";
import FontMenu from "../common/FontMenuButton";
import PdfPageWrapper from "../common/PdfPageWrapper";
import ReaderHeader from "../common/ReaderHeader";
import ReaderMenu from "../common/ReaderMenu";
import API from "../../services/APIURL";
import api from "../../types/api";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

const BookReaderPage: React.FC = () => {
  const { slugAndId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const accessToken = localStorage.getItem("accessToken");
  const bookId = slugAndId?.split("-").slice(-5).join("-");

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


  //  Reader settings
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState("Mặc định");
  const [background, setBackground] = useState("#ffffff");
  //show menu
  const [toc, setToc] = useState<{ label: string; href: string }[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [rendition, setRendition] = useState<any>(null);
  // Đọc trước 7 page gới guset
  const previewLimit = 7;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isGuest = !accessToken;
  const [openMenu, setOpenMenu] = useState<"font" | "toc" | null>(null);
  const allowedChapters = 2



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


  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const res = await api(`${API.books}/${bookId}`);
        if (!res.data) throw new Error("Không tìm thấy sách");
        const matched: Book = res.data;
        setBook(matched);

        if (matched.fileType === "pdf") {
          let restoredPage = parseInt(localStorage.getItem(`book-${matched.id}-page`) || "1", 10);

          if (!isGuest) {
            try {
              const resAct = await api.get(`${API.activities}/read/${matched.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              const serverPage = resAct.data?.lastPage;
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
          let restoredLocation = localStorage.getItem(`book-${matched.id}-location`) || "0";

          if (!isGuest) {
            try {
              const resAct = await api.get(`${API.activities}/read/${matched.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });

              const serverLocation = resAct.data?.lastLocation;
              if (serverLocation) {
                restoredLocation = serverLocation;
              } else {
                restoredLocation = localStorage.getItem(`book-${matched.id}-location`) || "0";
              }

              localStorage.setItem(`book-${matched.id}-location`, restoredLocation);
            } catch (err) {
              console.error("Sync server error:", err);
              restoredLocation = localStorage.getItem(`book-${matched.id}-location`) || "0";
            }
          } else {
            restoredLocation = localStorage.getItem(`book-${matched.id}-location`) || "0";
          }

          setCurrentLocation(restoredLocation);
        }
      } catch (err) {
        console.error(err);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId, navigate, isGuest, accessToken]);

  /** 📌 Change PDF page manually */
  const handlePageChange = async (offset: number) => {
    const step = viewMode === "double" ? 2 : 1;
    let newPage = currentPage + offset * step;

    if (viewMode === "double" && newPage % 2 === 0) {
      newPage -= 1;
    }

    if (isGuest && newPage > previewLimit) {
      setShowLoginModal(true);
      return;
    }

    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
      if (book) {
        localStorage.setItem(`book-${book.id}-page`, newPage.toString());
        if (userId) {
          try {
            await api.post(
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

      await api.delete(`${API.highlights}/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Delete highlight error:", err);
    }
  };

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);


 const lastValidLocationRef = useRef<string | null>(null);
  const prevCfiRef = useRef<string | null>(null);
  const [rollbackCfi, setRollbackCfi] = useState<string | null>(null);
  const isRollbackingRef = useRef(false);
  const isFirstLoadRef = useRef(true);

const checkGuestLimit = (location: any) => {
  if (isRollbackingRef.current) {
    return;
  }

  if (!isGuest || toc.length === 0) {
    prevCfiRef.current = lastValidLocationRef.current;
    lastValidLocationRef.current = location.start.cfi;
    return;
  }

  const normalizeHref = (s: string) =>
    (s.split("#")[0] || "").split("/").pop() || s;

  const currentIndex = toc.findIndex(
    (t) => normalizeHref(location.start.href) === normalizeHref(t.href)
  );

  if (currentIndex >= allowedChapters) {
    setShowLoginModal(true);
    const targetCfi = prevCfiRef.current || lastValidLocationRef.current;
    if (
      targetCfi &&
      !isRollbackingRef.current &&
      targetCfi !== location.start.cfi
    ) {
      setRollbackCfi(targetCfi);
    }
  } else if (currentIndex !== -1) {
    prevCfiRef.current = lastValidLocationRef.current;
    lastValidLocationRef.current = location.start.cfi;
  }

  if (isFirstLoadRef.current) {
    isFirstLoadRef.current = false;
  }
};

useEffect(() => {
  if (rollbackCfi && rendition) {
    console.log("🚫 Rollback to:", rollbackCfi);
    isRollbackingRef.current = true;
    rendition.display(rollbackCfi).then(() => {
      setRollbackCfi(null);
      setTimeout(() => {
        isRollbackingRef.current = false;
      }, 0);
    });
  }
}, [rollbackCfi, rendition]);


  useEffect(() => {
    if (rendition && toc.length > 0) {
      rendition.on("relocated", checkGuestLimit);
    }
  }, [rendition, toc]);


  const handleSelectChapter = (href: string) => {
    if (isGuest && toc.length > 0) {
      const targetIndex = toc.findIndex((t) => href.includes(t.href));
      if (targetIndex >= allowedChapters) {
        setShowLoginModal(true);
        return;
      }
    }
    rendition?.display(href);
  };
  const handleSelectNote = (cfi: string) => {
    if (isGuest && toc.length > 0) {
      const targetIndex = toc.findIndex((t) => cfi.includes(t.href));
      if (targetIndex >= allowedChapters) {
        setShowLoginModal(true);
        return;
      }
    }
    rendition?.display(cfi);
  };

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
        onOpenFontMenu={() => setOpenMenu(openMenu === "font" ? null : "font")}
        onToggleToc={() => setOpenMenu(openMenu === "toc" ? null : "toc")}
      />

      {openMenu && (
        <div
          className="fixed inset-0 bg-black/30 z-[19999]"
          onClick={() => setOpenMenu(null)}
        />
      )}
      {openMenu == "font" && (
        <motion.div
          key="fontmenu"
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute right-0 top-[40px] z-[20000]"
        >
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
        </motion.div>
      )}
      {/* Show Menu */}
      {openMenu == "toc" && (
        <>
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 right-0 h-full w-72 bg-gray-900 text-white z-[30000] shadow-lg"
          >
            <ReaderMenu
              toc={toc}
              notes={notes}
              onClose={() => setOpenMenu(null)}
              onSelectChapter={handleSelectChapter}
              onSelectNote={handleSelectNote}
              isMobile={false}
              onDeleteNote={handleDeleteNote}
            />
          </motion.div>
        </>
      )}

      {/* modal đăng yêu cầu đăng nhập */}
      {showLoginModal && (
        <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
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
                  api
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
                rend.on("relocated", checkGuestLimit);

              }}
              onNotesLoaded={(loadedNotes) => setNotes(loadedNotes)}

            />
          ) : (
            <div className="text-center text-red-600">
              Định dạng {book.fileType} chưa được hỗ trợ.
            </div>
          )
        ) : (
          <div className="text-center text-red-600">Không tìm thấy file.</div>
        )}
      </div>
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
