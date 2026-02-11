import { useEffect, useState } from "react";

interface ChapterProgressProps {
  rendition: any;
  isGuest : boolean;
}

export default function ChapterProgress({ rendition, isGuest }: ChapterProgressProps) {
  if (isGuest) return null; 


  const [chapterTitle, setChapterTitle] = useState<string>("Đang tải...");
  const [progress, setProgress] = useState<number>(0);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    if (!rendition) return;
    const updateInfo = () => {
      const currentLocation = rendition.currentLocation();
      if (currentLocation && currentLocation.start) {
        const item = rendition.book.navigation.get(currentLocation.start.href);
        const label = item ? item.label.trim() : `Trang: ${currentLocation.start.displayed.page}`;
        setChapterTitle(label);
        
        // 2. Tính % (Chỉ tính được khi locations đã generate xong)
        if (rendition.book.locations.length() > 0 && !isSeeking) {
            const percentage = rendition.book.locations.percentageFromCfi(currentLocation.start.cfi);
            const percentFixed = Math.round(percentage * 100);
            setProgress(percentFixed);
        }
      }
    };

   
    rendition.on("relocated", updateInfo);

    
    const intervalId = setInterval(() => {
      if (rendition.book.locations.length() > 0) {
         updateInfo(); // Cập nhật lại lần nữa khi đã có location
         clearInterval(intervalId); // Dừng kiểm tra
      }
    }, 1000);

    return () => {
      rendition.off("relocated", updateInfo);
      clearInterval(intervalId);
    };
  }, [rendition, isSeeking]);

  // --- LOGIC KÉO THANH TRƯỢT (Giữ nguyên) ---
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setIsSeeking(true);
    setProgress(val);
  };

  const handleSeekEnd = async () => {
    if (!rendition) return;

    if (rendition.book.locations.length() > 0) {
        const cfi = rendition.book.locations.cfiFromPercentage(progress / 100);
        if (cfi) await rendition.display(cfi);
    }
    setTimeout(() => setIsSeeking(false), 500);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm text-white px-4 py-3 z-[100000] border-t border-gray-700 shadow-lg">
      <div className="max-w-3xl mx-auto flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs text-gray-300 font-medium">
          <span className="truncate max-w-[70%]">{chapterTitle}</span>
          <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-200">
            {progress}%
          </span>
        </div>

        <div className="relative w-full h-4 flex items-center">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={progress}
              onChange={handleSeekChange}
              onMouseUp={handleSeekEnd}
              onTouchEnd={handleSeekEnd}
              className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all"
              style={{ accentColor: "#10b981", backgroundSize: `${progress}% 100%` }}
            />
        </div>
      </div>
    </div>
  );
}