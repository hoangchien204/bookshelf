import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { Page } from "react-pdf";

const ScrollPage: React.FC<{
  pageNumber: number;
  pageWidth: number;
  zoom: number;
  onVisible: (page: number) => void;
}> = ({ pageNumber, pageWidth, zoom, onVisible }) => {
  const { ref, inView } = useInView({
    threshold: 0.6, // khi 60% trang hiển thị
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView) onVisible(pageNumber);
  }, [inView, pageNumber, onVisible]);

  return (
    <div
      ref={ref}
      id={`page-${pageNumber}`}
      className="pdf-page-item border border-gray-300 rounded-md shadow-sm mb-4"
    >
      <Page
        pageNumber={pageNumber}
        width={Math.min(pageWidth * zoom, 600)}
        renderTextLayer={false}
        renderAnnotationLayer
      />
    </div>
  );
};
export default ScrollPage;