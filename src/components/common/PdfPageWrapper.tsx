import { Page } from "react-pdf";
import type { PDFPageProxy } from "pdfjs-dist";

interface PdfPageWrapperProps {
  pageNumber: number;
  pageWidth: number;
  highlightMode: boolean;
  onTextSelect?: () => void;
}

export default function PdfPageWrapper({
  pageNumber,
  pageWidth,
  highlightMode,
  onTextSelect,
}: PdfPageWrapperProps) {
 const syncTextLayer = (pdfPage: PDFPageProxy, highlightMode: boolean) => {
  const pageNumber = pdfPage.pageNumber;

  const textLayer = document.querySelector(
    `#page-${pageNumber} .react-pdf__Page__textContent`
  ) as HTMLElement;

  const canvas = document.querySelector(
    `#page-${pageNumber} canvas`
  ) as HTMLCanvasElement;

  if (textLayer && canvas) {
    const { width, height } = canvas.getBoundingClientRect();
    textLayer.style.width = `${width}px`;
    textLayer.style.height = `${height}px`;
    textLayer.style.position = "absolute";
    textLayer.style.top = "0";
    textLayer.style.left = "0";
    textLayer.style.transformOrigin = "0 0";
    textLayer.style.transform = canvas.style.transform;

    // fix màu chữ theo chế độ
    textLayer.querySelectorAll("span").forEach((el) => {
      const span = el as HTMLElement;
      span.style.color = highlightMode ? "black" : "transparent";
      span.style.background = "transparent";
      span.style.userSelect = highlightMode ? "text" : "none";
      span.style.pointerEvents = highlightMode ? "auto" : "none";
    });
  }
};

  return (
    <div
      id={`page-${pageNumber}`}
      className={`pdf-page-wrapper relative ${highlightMode ? "highlight-mode" : ""}`}
      onMouseUp={onTextSelect}
      style={{ display: "inline-block" }} // quan trọng để double mode không bị chồng
    >
      <Page
        className="pdf-page-item border border-gray-300 rounded-md shadow-sm"
        pageNumber={pageNumber}
        width={Math.min(pageWidth, 600)}
        renderMode={highlightMode ? "none" : "canvas"} 
        renderTextLayer
        renderAnnotationLayer={false}
        onRenderSuccess={(pdfPage) => syncTextLayer(pdfPage, highlightMode)}
      />
    </div>
  );
}
