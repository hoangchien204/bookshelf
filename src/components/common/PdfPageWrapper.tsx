import { Page } from "react-pdf";

interface PdfPageWrapperProps {
  pageNumber: number;
  pageWidth: number;
  onTextSelect?: () => void;
  fitMode?: "width" | "height";
  highlights?: {
    rects: { x: number; y: number; w: number; h: number }[];
    color: string;
  }[];
  isFullscreen?: boolean;
}

export default function PdfPageWrapper({
  pageNumber,
  pageWidth,
  onTextSelect,
  fitMode = "width",
  isFullscreen = false, 
}: PdfPageWrapperProps) {
  return (
    <div
      id={`page-${pageNumber}`}
      className="pdf-page-wrapper relative"
      onMouseUp={onTextSelect}
    >
      <Page
        key={`${pageNumber}-${isFullscreen}`}
        className="pdf-page-item border border-gray-300 rounded-md shadow-sm"
        pageNumber={pageNumber}
        width={fitMode === "width" ? pageWidth : undefined}
        height={window.innerHeight - 120}
        renderMode="canvas"
        renderTextLayer={false}
        renderAnnotationLayer={false}
      />
    </div>
  );
}
