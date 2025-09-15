import { ReactReader } from "react-reader";
import type { EpubReaderWrapperProps, HighlightNote } from "../../types/EpubReader";
import { useState } from "react";
import { FiEdit2, FiTrash2, FiX } from "react-icons/fi";

interface EpubReaderMobileProps extends EpubReaderWrapperProps {
    bookData: ArrayBuffer | null;
    error: string | null;
    setRendition: (rend: any) => void;

    // highlight
    notes: HighlightNote[];
    editingNote: HighlightNote | null;
    setEditingNote: (n: HighlightNote | null) => void;
    handleUpdateNote: (id: string, color?: string, note?: string) => void;
    handleAddNote: (color: string, note?: string) => void;

    // modal state
    showModal: boolean;
    setShowModal: (b: boolean) => void;
    resetModal: () => void;

    // temp state
    tempCFI: string | null;
    setTempCFI: (cfi: string | null) => void;
    tempNote: string;
    setTempNote: (txt: string) => void;
    tempColor: string;
    setTempColor: (color: string) => void;
    charCount: number;
    rendition: any;
    customStyles: any;

    setupRendition: (
        rend: any,
        onReady?: (rend: any, toc: { label: string; href: string }[], notes: HighlightNote[]) => void,
        openEditModal?: (cfiRange: string, contents: any) => void
    ) => void;
}

export default function EpubReaderMobile({
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
    rendition,
    handleUpdateNote,
    handleAddNote,
    tempColor,
    tempNote,
    charCount,
    customStyles,
    setupRendition,
    onReady,
    onNotesLoaded,
    tempCFI,
}: EpubReaderMobileProps) {
    const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
    const [showToolbar, setShowToolbar] = useState(false);
    
    if (error) return <div className="text-center text-red-600">{error}</div>;
    if (!bookData) return <div className="text-center">⏳ Đang tải EPUB...</div>;

    return (
        <div className="h-full flex flex-col relative">
            <ReactReader
                url={bookData}
                showToc={false}
                location={location ?? null}
                locationChanged={(epubcfi) => onLocationChange?.(epubcfi)}
                getRendition={(rend) => {
                    setRendition(rend);

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

                            const sel = contents.window.getSelection();
                            if (sel && sel.rangeCount > 0 && sel.toString().trim() !== "") {
                                const rect = sel.getRangeAt(0).getBoundingClientRect();
                                const iframeRect =
                                    contents.document.defaultView?.frameElement?.getBoundingClientRect();

                                const x = rect.left + rect.width / 2 + (iframeRect?.left || 0);
                                const y = rect.top + (iframeRect?.top || 0);

                                setPopupPos({ x, y });
                                setShowToolbar(true);
                            }
                        }
                    );
                }}
                readerStyles={customStyles}
            />
            {showToolbar && popupPos && (
                <div
                    className="absolute z-50 flex items-center gap-3 px-3 py-2 rounded-lg bg-black shadow-lg"
                    style={{
                        top: popupPos.y - 150,
                        left: popupPos.x - 100,
                    }}
                    onClick={() => setShowToolbar(false)}
                >
                    {/* Nút chọn màu */}
                    {["#d5b8ff", "#aee1ff", "#ffc4d6", "#fff9b1"].map((c) => (
                        <button
                            key={c}
                            className={`w-6 h-6 rounded-full border-2 ${tempColor === c ? "border-green-400" : "border-white"
                                }`}
                            style={{ background: c }}
                            onClick={() => {
                                if (editingNote) {
                                    // Xoá highlight cũ
                                    rendition?.annotations.remove(editingNote.cfiRange, "highlight");
                                    rendition?.annotations.add(
                                        "highlight",
                                        editingNote.cfiRange,
                                        { note: editingNote.note },
                                        null,
                                        editingNote.id,
                                        { fill: c || "#d5b8ff", "fill-opacity": "0.5", "mix-blend-mode": "multiply" }
                                    );

                                    handleUpdateNote(editingNote.id, c, editingNote.note);
                                } else if (tempCFI) {
                                    // Thêm highlight mới
                                    const id = "hl-" + Date.now();
                                    rendition?.annotations.add(
                                        "highlight",
                                        tempCFI,
                                        { note: tempNote },
                                        null,
                                        id,
                                        { fill: c, "fill-opacity": "0.5", "mix-blend-mode": "multiply" }
                                    );

                                    handleAddNote(c, tempNote);
                                }
                                setShowToolbar(false);
                            }}
                        />
                    ))}

                    {/* Nút mở modal ghi chú */}
                    <button
                        onClick={() => {
                            setShowToolbar(false);
                            setShowModal(true);
                        }}
                        className="text-white hover:text-green-400"
                    >
                        <FiEdit2 size={18} />
                    </button>

                    {/* Nút xoá highlight */}
                    {editingNote && (
                        <button
                            onClick={() => {
                                rendition?.annotations.remove(editingNote.cfiRange, "highlight");
                                setShowToolbar(false);
                            }}
                            className="text-white hover:text-red-400"
                        >
                            <FiTrash2 size={18} />
                        </button>
                    )}

                    {/* Nút đóng popup */}
                    <button
                        onClick={() => setShowToolbar(false)}
                        className="text-white hover:text-gray-400"
                    >
                        <FiX size={18} />
                    </button>
                </div>
            )}


            {/* Modal chi tiết ghi chú */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex flex-col">
                    <div className="flex justify-between items-center p-4 bg-gray-900 text-white">
                        <h3 className="text-lg font-bold">Ghi chú</h3>
                        <button onClick={resetModal} className="text-white text-xl">
                            <FiX />
                        </button>
                    </div>

                    <div className="flex-1 p-4 bg-white dark:bg-gray-900 overflow-y-auto">
                        <textarea
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value.slice(0, 200))}
                            className="w-full p-2 border rounded mb-2 dark:bg-gray-800 dark:text-white resize-none"
                            rows={4}
                            placeholder="Nhập ghi chú..."
                        />

                        <div className="flex justify-between items-center">
                            <div
                                className={`text-xs ${charCount >= 200 ? "text-red-500" : "text-gray-400"
                                    }`}
                            >
                                {charCount}/200 ký tự
                            </div>
                            <button
                                onClick={() => {
                                    if (editingNote) {
                                        rendition?.annotations.remove(editingNote.cfiRange, "highlight");
                                        rendition?.annotations.add("highlight", editingNote.cfiRange, {
                                            note: tempNote,
                                            fill: tempColor,
                                        });
                                        handleUpdateNote(editingNote.id, tempColor, tempNote);
                                    } else if (tempCFI) {
                                        rendition?.annotations.add("highlight", tempCFI, {
                                            note: tempNote,
                                            fill: tempColor,
                                        });
                                        handleAddNote(tempColor, tempNote);
                                    }
                                    resetModal();
                                }}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg"
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
