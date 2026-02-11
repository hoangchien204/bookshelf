import { ReactReader } from "react-reader";

import { useState } from "react";
import LoginModal from "../../screens/login";
import type { EpubReaderMobileProps } from "../../types/EpubReader";
export default function EpubReaderMobile({
  bookData,
  error,
  location,
  onLocationChange,
  setRendition,
  customStyles,
  setupRendition,
  onReady,
  onNotesLoaded,
}: EpubReaderMobileProps) {
  const [showLogin, setShowLogin] = useState(false);
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
          );
        }}
        readerStyles={customStyles}
      />
      {/*  */}
      {showLogin && (
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      )}
    </div>
  );
}
