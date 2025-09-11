import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { FaAngleLeft, FaAngleRight  } from "react-icons/fa";

interface HorizontalSliderProps {
    children: ReactNode;
    itemWidth?: number;
    gap?: string;
}

export default function HorizontalSlider({
    children,
    itemWidth = 250,
    gap = "gap-6",
}: HorizontalSliderProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // drag-to-scroll (chỉ mobile)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (window.innerWidth >= 768) return; // 👉 desktop bỏ qua
        setIsDown(true);
        setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
        setScrollLeft(scrollRef.current?.scrollLeft || 0);
    };
    const handleMouseLeave = () => setIsDown(false);
    const handleMouseUp = () => setIsDown(false);
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDown || !scrollRef.current) return;
        if (window.innerWidth >= 768) return; // 👉 desktop bỏ qua
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 1;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const isMobile = window.innerWidth < 768;

    return (
        <div className="relative w-full">
            {/* Nút trái/phải chỉ hiện trên desktop */}
            {!isMobile && (
                <button
                    onClick={() =>
                        scrollRef.current?.scrollBy({ left: -itemWidth, behavior: "smooth" })
                    }
                    className="absolute left-0 -translate-x-1/2 top-1/2 -translate-y-1/2 
               bg-black/50 text-white p-2 rounded-full z-10 w-[40px] h-[40px]"        >
                    <FaAngleLeft />
                </button>
            )}

            <div
                ref={scrollRef}
                className={`flex ${gap} overflow-x-auto scroll-smooth scrollbar-hide ${isMobile ? "cursor-grab active:cursor-grabbing" : ""
                    }`}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                {children}
            </div>

            {!isMobile && (
                <button
                    onClick={() =>
                        scrollRef.current?.scrollBy({ left: itemWidth, behavior: "smooth" })
                    }
                    className="absolute right-0 translate-x-1/2 top-1/2 -translate-y-1/2 
               bg-black/50 text-white p-2 rounded-full z-10 w-[40px] h-[40px]"                >
                    <FaAngleRight />
                </button>
            )}
        </div>
    );
}
