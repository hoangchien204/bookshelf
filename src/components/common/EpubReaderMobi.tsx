import { ReactReader } from "react-reader";

import { useState } from "react";
import LoginModal from "../../screens/login";
import type { EpubReaderMobileProps } from "../../types/EpubReader";
import Loading from "./Loading";
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
  isGuest,
}: EpubReaderMobileProps) {
  const [showLogin, setShowLogin] = useState(false);
  if (error) return <div className="text-center text-red-600">{error}</div>;
  if (!bookData) return <Loading />;

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
            (rendition: any, tocData: any[], noteData: any[]) => {
              onReady?.(rendition, tocData, noteData);
              onNotesLoaded?.(noteData);
            },
            (_cfiRange, contents) => {
              if (isGuest) {
                setShowLogin(true);
                contents.window.getSelection().removeAllRanges();
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                return;
              }
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
