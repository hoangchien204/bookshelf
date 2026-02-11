import type { HighlightNote } from "../../../types/EpubReader";

interface HighlightNoteModalProps {
  show: boolean;
  resetModal: () => void;

  editingNote: HighlightNote | null;
  rendition: any;

  tempColor: string;
  setTempColor: (color: string) => void;

  tempNote: string;
  setTempNote: (v: string) => void;

  showTextbox: boolean;
  setShowTextbox: (b: boolean) => void;

  charCount: number;

  handleUpdateNote: (id: string, color?: string, note?: string) => void;
  handleAddNote: (color: string, note?: string) => void;
  onDeleteNote?: (id: string) => void;
}

export default function HighlightNoteModal({
  show,
  resetModal,
  editingNote,
  rendition,
  tempColor,
  setTempColor,
  tempNote,
  setTempNote,
  showTextbox,
  setShowTextbox,
  charCount,
  handleUpdateNote,
  handleAddNote,
  onDeleteNote,
}: HighlightNoteModalProps) {
  if (!show) return null;

  const colors = ["#fff9b1", "#aee1ff", "#ffc4d6", "#d5b8ff"];

  const handleColorClick = (c: string) => {
    if (editingNote) {
      if (editingNote.color === c) {
        rendition?.annotations.remove(editingNote.cfiRange, "highlight");
        onDeleteNote?.(editingNote.id);
        resetModal();
      } else {
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
        resetModal();
      }
    } else if (!showTextbox) {
      handleAddNote(c);
      resetModal();
    } else {
      setTempColor(c);
    }
  };

  const handleSave = () => {
    const finalColor = tempColor || "#fff9b1";

    if (editingNote) {
      handleUpdateNote(editingNote.id, finalColor, tempNote);
    } else {
      handleAddNote(finalColor, tempNote);
    }

    resetModal();
  };

  return (
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

        <div className="grid grid-cols-4 gap-3 mb-4">
          {colors.map((c) => (
            <div
              key={c}
              className={`h-10 rounded-lg cursor-pointer border-2 flex items-center justify-center transition-transform ${
                tempColor === c
                  ? "border-green-500 scale-105"
                  : "border-transparent"
              }`}
              style={{ background: c }}
              onClick={() => handleColorClick(c)}
            >
              {tempColor === c && (
                <span className="text-green-600 font-bold">✓</span>
              )}
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

        {showTextbox && (
          <>
            <textarea
              value={tempNote}
              onChange={(e) =>
                setTempNote(e.target.value.slice(0, 200))
              }
              className="w-full p-2 border rounded mb-2 dark:bg-gray-800 dark:text-white resize-none"
              rows={3}
              placeholder="Nhập ghi chú"
            />
            <div className="flex justify-between items-center">
              <div
                className={`text-xs ${
                  charCount >= 200
                    ? "text-red-500"
                    : "text-gray-400"
                }`}
              >
                {charCount}/200 ký tự
              </div>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Lưu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
