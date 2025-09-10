import { Page } from "react-pdf";
import HighlightOverlay from "./HighlightOverlay";

interface PdfPageWrapperProps {
  pageNumber: number;
  pageWidth: number;
  onTextSelect?: () => void;
  fitMode?: "width" | "height";
  highlights?: {
    rects: { x: number; y: number; w: number; h: number }[];
    color: string;
  }[];
  isFullscreen?: boolean; // 👈 thêm vào
}

export default function PdfPageWrapper({
  pageNumber,
  pageWidth,
  onTextSelect,
  fitMode = "width",
  highlights = [],
  isFullscreen = false, // 👈 default
}: PdfPageWrapperProps) {
  return (
    <div
      id={`page-${pageNumber}`}
      className="pdf-page-wrapper relative"
      onMouseUp={onTextSelect}
    >
      <Page
        key={`${pageNumber}-${isFullscreen}`} // ✅ force re-mount khi đổi fullscreen
        className="pdf-page-item border border-gray-300 rounded-md shadow-sm"
        pageNumber={pageNumber}
        width={fitMode === "width" ? pageWidth : undefined}
        height={fitMode === "height" ? window.innerHeight - 96 : undefined}
        renderMode="canvas"
        renderTextLayer={false}
        renderAnnotationLayer={false}
      />

      <HighlightOverlay highlights={highlights} />
    </div>
  );
}
