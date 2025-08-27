import { Page } from "react-pdf";
import type { PDFPageProxy } from "pdfjs-dist";
import HighlightOverlay from "./HighlightOverlay";
import { useEffect, useRef } from "react";

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
  const lastPdfPageRef = useRef<PDFPageProxy | null>(null);

  const syncTextLayer = (pdfPage: PDFPageProxy) => {
    lastPdfPageRef.current = pdfPage;
        console.log(`[PdfPageWrapper] 🔄 syncTextLayer page ${pdfPage.pageNumber}, fullscreen=${isFullscreen}`);

    const pageNum = pdfPage.pageNumber;
    const textLayer = document.querySelector(
      `#page-${pageNum} .react-pdf__Page__textContent`
    ) as HTMLElement | null;
    const canvas = document.querySelector(
      `#page-${pageNum} canvas`
    ) as HTMLCanvasElement | null;

    if (textLayer && canvas) {
      const canvasStyle = window.getComputedStyle(canvas);

      textLayer.style.transform = canvasStyle.transform;
      textLayer.style.transformOrigin = canvasStyle.transformOrigin;

      textLayer.style.width = canvas.style.width;
      textLayer.style.height = canvas.style.height;

      textLayer.style.position = "absolute";
      textLayer.style.top = "0";
      textLayer.style.left = "0";

      // Ẩn text thực (chỉ dùng để select)
      textLayer.style.opacity = "0";
      textLayer.querySelectorAll("span").forEach((el) => {
        (el as HTMLElement).style.color = "transparent";
      });
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (lastPdfPageRef.current) {
        syncTextLayer(lastPdfPageRef.current);
      }
    };
    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleResize);
    };
  }, []);

  useEffect(() => {
          console.log("[PdfPageWrapper] 📏 Resize hoặc FullscreenChange -> gọi sync");

    if (lastPdfPageRef.current) {
      syncTextLayer(lastPdfPageRef.current);
    }
  }, [isFullscreen]);

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
        renderTextLayer
        renderAnnotationLayer={false}
        onRenderSuccess={(pdfPage) => syncTextLayer(pdfPage)}
      />

      <HighlightOverlay highlights={highlights} />
    </div>
  );
}
