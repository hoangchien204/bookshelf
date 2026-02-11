import { ReactReader } from "react-reader";
import { useState } from "react";
import LoginModal from "../../screens/login";
import HighlightNoteModal from "./modal/HighlightNoteModal";
import type { EpubReaderPCProps } from "../../types/EpubReader";

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
  isGuest,
}: EpubReaderPCProps) {
  if (error) return <div className="text-center text-red-600">{error}</div>;
  if (!bookData) return <div className="text-center">⏳ Đang tải...</div>;
  const [showLogin, setShowLogin] = useState(false);
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

          setupRendition(
            rend,
            (
              rendition: any,
              tocData: { label: string; href: string }[],
              noteData: any[],
            ) => {
              onReady?.(rendition, tocData, noteData);
              onNotesLoaded?.(noteData);
            },
            (cfiRange: string, contents: any) => {
              if (isGuest) {
                setShowLogin(true);
                return;
              }
              setEditingNote(null);
              setTempCFI(cfiRange);
              setTempNote("");
              setTempColor("");
              setShowModal(true);
              contents.window.getSelection().removeAllRanges();
            },
          );
        }}
        readerStyles={customStyles}
      />

      {/* Modal ghi chú (UI PC) */}
      <HighlightNoteModal
        show={showModal}
        resetModal={resetModal}
        editingNote={editingNote}
        rendition={rendition}
        tempColor={tempColor}
        setTempColor={setTempColor}
        tempNote={tempNote}
        setTempNote={setTempNote}
        showTextbox={showTextbox}
        setShowTextbox={setShowTextbox}
        charCount={charCount}
        handleUpdateNote={handleUpdateNote}
        handleAddNote={handleAddNote}
        onDeleteNote={onDeleteNote}
      />

      {showLogin && (
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
}
