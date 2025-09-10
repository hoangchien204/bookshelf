import { ReactReader, ReactReaderStyle, type IReactReaderStyle } from "react-reader";
import { useState, useEffect } from "react";
import axios from "axios";
import API from "../../services/API";
interface EpubReaderWrapperProps {
  fileUrl: string;
  bookId: string;
  location?: string | number | null;
  onLocationChange?: (loc: string | number) => void;
  fontSize?: number;
  fontFamily?: string;
  background?: string;
  scrollMode?: boolean;
  viewMode?: "single" | "double";
  onReady?: (rendition: any, toc: { label: string; href: string }[], notes: any[]) => void;
  onNotesLoaded?: (notes: HighlightNote[]) => void;
}

interface HighlightNote {
  id: string;
  cfiRange: string;
  note?: string;
  color?: string;
}

export default function CustomEpubReader({
  fileUrl,
  bookId,
  location,
  onLocationChange,
  fontSize = 16,
  fontFamily = "Mặc định",
  background = "#ffffff",
  scrollMode,
  viewMode,
  onReady,
  onNotesLoaded
}: EpubReaderWrapperProps) {
  const [bookData, setBookData] = useState<ArrayBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendition, setRendition] = useState<any>(null);

  // Highlight + note
  const [notes, setNotes] = useState<HighlightNote[]>([]);
  const [editingNote, setEditingNote] = useState<HighlightNote | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [tempCFI, setTempCFI] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");
  const [tempColor, setTempColor] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [showTextbox, setShowTextbox] = useState(false);
  const token = localStorage.getItem("accessToken");

  const resetModal = () => {
    setShowModal(false);
    setTempCFI(null);
    setTempNote("");
    setTempColor("");
    setEditingNote(null);
  };

  // Load EPUB file
  useEffect(() => {
    if (!fileUrl) return;
    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        setBookData(buffer);
        setError(null);
      })
      .catch((err) => {
        console.error("❌ EPUB load error:", err);
        setError("Không thể tải EPUB. Vui lòng thử lại.");
      });
  }, [fileUrl]);

  // Load highlights from API
  useEffect(() => {
    if (!bookId || !token) return;

    axios.get(`${API.highlights}/${bookId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        const highlights = Array.isArray(res.data) ? res.data : res.data.data;
        setNotes(highlights || []);
        onNotesLoaded?.(highlights || []);
      })
      .catch((err) => console.error("❌ Load highlights error:", err));
  }, [bookId, token]);
useEffect(() => {
  if (!rendition) return;
  const fixTop = () => {
    const containers = document.querySelectorAll(".epub-container");
    containers.forEach((c) => {
      (c as HTMLElement).style.top = "-54px";
    });
  };
  rendition.on("relocated", fixTop);
  return () => rendition.off("relocated", fixTop);
}, [rendition]);
  useEffect(() => {
    if (rendition) {
      // Background + text color
      rendition.themes.register("custom", {
        body: {
          "background": background,
          "color": background === "#000000" ? "white" : "black",
          "line-height": "1.6",
        },
      });
      rendition.themes.select("custom");
      if (fontSize) {
        rendition.themes.fontSize(`${fontSize}px`);
      }
      if (fontFamily && fontFamily !== "Mặc định") {
        rendition.themes.font(fontFamily);
      } else {
        rendition.themes.font("inherit");
      }
    }
  }, [rendition, fontSize, fontFamily, background]);

  // Render highlights into epub.js when notes change
  useEffect(() => {
    if (!rendition) return;
    rendition.annotations.removeAll?.();

    notes.forEach((n) => {
      if (!n.cfiRange) return;
      rendition.annotations.add(
        "highlight",
        n.cfiRange,
        { note: n.note },
        () => openEditModal(n),
        `hl-${n.id}`,   // class unique
        { fill: n.color || "yellow" }
      );
    });
  }, [rendition, notes]);

  useEffect(() => {
    if (rendition) {
      rendition.flow(scrollMode ? "scrolled-doc" : "paginated"); // ✅ cuộn dọc hoặc lật trang
      rendition.spread(viewMode === "double" ? "always" : "none"); // ✅ single vs double page
    }
  }, [rendition, scrollMode, viewMode]);
  // Count characters in note
  useEffect(() => {
    setCharCount(tempNote.length);
  }, [tempNote]);

  // Add new highlight
  const handleAddNote = async (color: string, note?: string) => {
    if (!tempCFI) return;

    try {
      const res = await axios.post(
        API.highlights,
        {
          bookId,
          cfiRange: tempCFI,
          color,
          note,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const savedNote = res.data;
      setNotes((prev) => [...prev.filter((n) => n.cfiRange !== tempCFI), savedNote]);
    } catch (err) {
      console.error("❌ Save highlight error:", err);
    }
  };

  const customStyles: IReactReaderStyle = {
    ...ReactReaderStyle, // giữ lại toàn bộ style gốc
    readerArea: {
      ...ReactReaderStyle.readerArea,
      background: background,
      padding: 0,
      margin: 0,
      height: "100%",
    },
    arrow: {
      ...ReactReaderStyle.arrow,
      background: "#313131ff", // xanh dương
      color: "#fff",
      borderRadius: "100%", // tròn
      width: "34px",
      height: "34px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "25px",
    },
  };
  // Update existing highlight
  const handleUpdateNote = async (id: string, color?: string, note?: string) => {
    try {
      const res = await axios.patch(
        `${API.highlights}/${id}`,
        { color, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data;
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, color: updated.color, note: updated.note } : n))
      );
    } catch (err) {
      console.error("❌ Update highlight error:", err);
    }
  };
  const setupRendition = (
    rend: any,
    onReady?: (
      rend: any,
      toc: { label: string; href: string }[],
      notes: any[]
    ) => void,
    openEditModal?: (cfiRange: string, contents: any) => void
  ) => {
    // Sinh location
    rend.book.ready
      .then(() => rend.book.locations.generate(1024))
      .then(() => {
        console.log("✅ Locations generated:", rend.book.locations.length);
      });

    // Lấy TOC
    const tocData = rend.book.navigation.toc.map((item: any) => ({
      label: item.label,
      href: item.href,
    }));

    // 🚀 Tạm để notes rỗng (sau có thể fetch từ API hoặc truyền từ ngoài vào)
    const notes: any[] = [];

    onReady?.(rend, tocData, notes);

    // Lắng nghe highlight
    rend.on("selected", (cfiRange: string, contents: any) => {
      openEditModal?.(cfiRange, contents);
    });
  };

  // Open modal for editing
  const openEditModal = (n: HighlightNote) => {
    setEditingNote(n);
    setTempCFI(n.cfiRange);
    setTempNote(n.note || "");
    setTempColor(n.color || "");
    setShowTextbox(false);
    setShowModal(true);
  };

  if (error) return <div className="text-center text-red-600">{error}</div>;
  if (!bookData) return <div className="text-center">⏳ Đang tải EPUB...</div>;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* ReactReader */}
      {/* <div className="relative flex-1 reader-container" style={{ background: background }}> */}
      <ReactReader
        url={bookData}
        showToc={false}
        location={location ?? null}
        locationChanged={(epubcfi) => onLocationChange?.(epubcfi)}
        getRendition={(rend) => {
          setRendition(rend);

          // 🚀 Fix viền trên của epub container
          requestAnimationFrame(() => {
            const containers = document.querySelectorAll(".epub-container");
            containers.forEach((c) => {
              (c as HTMLElement).style.top = "-54px";
            });
          });

          setupRendition(
            rend,
            (rendition, tocData, noteData) => {
              onReady?.(rendition, tocData, noteData);
              onNotesLoaded?.(noteData);
            },
            (cfiRange, contents) => {
              setEditingNote(null);
              setTempCFI(cfiRange);
              setTempNote("");
              setTempColor("");
              setShowModal(true);
              contents.window.getSelection().removeAllRanges();
            }
          );
        }}
        readerStyles={customStyles}
      />
      {/* </div> */}


      {/* Modal ghi chú */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={resetModal}
        >
          <div
            className="bg-black dark:bg-gray-900 p-4 rounded-xl w-[276px] shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={resetModal}
              className="absolute top-4 right-2 w-5 h-5 bg-white rounded-full flex justify-center items-center font-bold leading-none text-[10px]"
            >
              x
            </button>

            <h3 className="font-bold mb-3 text-white">Ghi chú</h3>

            {/* 4 ô màu */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {["#fff9b1", "#aee1ff", "#ffc4d6", "#d5b8ff"].map((c) => (
                <div
                  key={c}
                  className={`h-10 rounded-lg cursor-pointer border-2 flex items-center justify-center 
              transition-transform ${tempColor === c ? "border-green-500 scale-105" : "border-transparent"}`}
                  style={{ background: c }}
                  onClick={() => {
                    if (editingNote) {
                      // Xóa highlight cũ khỏi epub.js
                      rendition?.annotations.remove(editingNote.cfiRange, "highlight");
                      handleUpdateNote(editingNote.id, c, editingNote.note);
                      resetModal();
                    } else if (!showTextbox) {
                      handleAddNote(c);
                      resetModal();
                    } else {
                      setTempColor(c);
                    }
                  }}
                >
                  {tempColor === c && <span className="text-green-600 font-bold">✓</span>}
                </div>
              ))}
            </div>

            {/* Nút thêm ghi chú */}
            {!showTextbox && (
              <button
                onClick={() => setShowTextbox(true)}
                className="w-full py-2 rounded-full bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-white"
              >
                Thêm ghi chú
              </button>
            )}

            {/* Textbox nhập note */}
            {showTextbox && (
              <>
                <textarea
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value.slice(0, 200))}
                  className="w-full p-2 border rounded mb-2 dark:bg-gray-800 dark:text-white resize-none"
                  rows={3}
                  placeholder="Nhập ghi chú"
                />
                <div className="flex justify-between items-center">
                  <div className={`text-xs ${charCount >= 200 ? "text-red-500" : "text-gray-400"}`}>
                    {charCount}/200 ký tự
                  </div>
                  <button
                    onClick={() => {
                      if (editingNote) {
                        handleUpdateNote(editingNote.id, tempColor, tempNote);
                      } else {
                        handleAddNote(tempColor, tempNote);
                      }
                      resetModal();
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded"
                  >
                    Lưu
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}


