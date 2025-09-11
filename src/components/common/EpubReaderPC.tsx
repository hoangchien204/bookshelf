import { ReactReader } from "react-reader";
import type { EpubReaderWrapperProps, HighlightNote } from "../../types/EpubReader";

interface EpubReaderPCProps extends EpubReaderWrapperProps {
  bookData: ArrayBuffer | null;
  error: string | null;
  setRendition: (rend: any) => void;

  // state + handler cho modal
  showModal: boolean;
  resetModal: () => void;
  editingNote: HighlightNote | null;
  setEditingNote: (n: HighlightNote | null) => void;
  setTempCFI: (cfi: string) => void;
  setTempColor: (color: string) => void;
  setShowModal: (b: boolean) => void;

  rendition: any;
  handleUpdateNote: (id: string, color?: string, note?: string) => void;
  handleAddNote: (color: string, note?: string) => void;
  onDeleteNote?: (id: string) => void;
  tempColor: string;
  showTextbox: boolean;
  setShowTextbox: (b: boolean) => void;
  tempNote: string;
  setTempNote: (v: string) => void;
  charCount: number;

  customStyles: any;
  setupRendition: (
    rend: any,
    onReady?: (rend: any, toc: { label: string; href: string }[], notes: any[]) => void,
    openEditModal?: (cfiRange: string, contents: any) => void
  ) => void;
}

export default function EpubReaderPC({
  bookData,
  error,
  location,
  onLocationChange,
  setRendition,
  showModal,
  resetModal,
  editingNote,
  setEditingNote,
  setTempCFI,
  setTempNote,
  setTempColor,
  setShowModal,
  onDeleteNote,
  rendition,
  handleUpdateNote,
  handleAddNote,
  tempColor,
  showTextbox,
  setShowTextbox,
  tempNote,
  charCount,
  customStyles,
  setupRendition,
  onReady,
  onNotesLoaded,
}: EpubReaderPCProps) {
  if (error) return <div className="text-center text-red-600">{error}</div>;
  if (!bookData) return <div className="text-center">⏳ Đang tải EPUB...</div>;

  return (
    <div className="h-full flex flex-col">
      <ReactReader
        url={bookData}
        showToc={false}
        location={location ?? null}
        locationChanged={(epubcfi) => onLocationChange?.(epubcfi)}
        getRendition={(rend) => {
          setRendition(rend);

          // fix viền trên
          requestAnimationFrame(() => {
            const containers = document.querySelectorAll(".epub-container");
            containers.forEach((c) => {
              (c as HTMLElement).style.top = "-54px";
            });
          });

          // gọi setupRendition giống file core
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

      {/* Modal ghi chú (UI PC) */}
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
                  className={`h-10 rounded-lg cursor-pointer border-2 flex items-center justify-center transition-transform ${tempColor === c ? "border-green-500 scale-105" : "border-transparent"
                    }`}
                  style={{ background: c }}
                  onClick={() => {
                    if (editingNote) {
                      if (editingNote.color === c) {
                        // 👉 Nếu chọn lại đúng màu cũ => XÓA highlight
                        rendition?.annotations.remove(editingNote.cfiRange, "highlight");
                        onDeleteNote?.(editingNote.id);
                      } else {
                        // 👉 Nếu chọn màu khác => UPDATE
                        rendition?.annotations.remove(editingNote.cfiRange, "highlight");
                        rendition?.annotations.add(
                          "highlight",
                          editingNote.cfiRange,
                          { note: editingNote.note },
                          null,
                          editingNote.id,
                          { fill: c, "fill-opacity": "0.5", "mix-blend-mode": "multiply" }
                        );
                        handleUpdateNote(editingNote.id, c, editingNote.note);
                      }
                      resetModal();
                    } else if (!showTextbox) {
                      // 👉 Highlight mới
                      handleAddNote(c);
                      resetModal();
                    } else {
                      // 👉 Đang gõ note thì chỉ set màu tạm
                      setTempColor(c);
                    }
                  }}
                >
                  {tempColor === c && <span className="text-green-600 font-bold">✓</span>}
                </div>
              ))}
            </div>


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
