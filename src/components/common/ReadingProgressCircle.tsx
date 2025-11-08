import { useEffect, useState } from "react";

interface ChapterProgressProps {
  rendition: any;
}

export default function ChapterProgress({ rendition }: ChapterProgressProps) {
  const [chapterTitle, setChapterTitle] = useState<string>(" ");
  const [chapterProgress, setChapterProgress] = useState<number>(0);

  useEffect(() => {
    if (!rendition) return;

    rendition.on("relocated", (location: any) => {
      // lấy tên chương
      const currentLoc = rendition.book.navigation.get(location.start.href);
      setChapterTitle(currentLoc?.label || " ");

      // % trong sách (có thể tính riêng theo chương nếu muốn chi tiết hơn)
      const percent = rendition.book.locations.percentageFromCfi(location.start.cfi);
      const chapterPercent = Math.round(percent * 100);
      setChapterProgress(chapterPercent);
    });
  }, [rendition]);

  return (
   <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white px-6 py-3 z-50 z-[100000]">
   <div className="w-2/3 mx-auto">
    {/* Hàng 1: tên chương + % */}
    <div className="flex justify-between text-sm mb-1">
      <span className="truncate">{chapterTitle}</span>
      <span>{chapterProgress}%</span>
    </div>

    <input
      type="range"
      min={0}
      max={100}
      value={chapterProgress}
      readOnly
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      style={{ accentColor: "#10b981" }}
    />
  </div>
</div>

  );
}
