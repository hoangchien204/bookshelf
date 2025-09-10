import { useState } from "react";
import { IoCheckmark } from "react-icons/io5";

const backgrounds = ["#000000", "#e5e7eb", "#d6d3d1", "#f5f0dc"];
const fonts = ["Mặc định", "Netflix Sans", "Arial", "Bookerly", "Minion", "Times New Roman", "Roboto"];

interface FontMenuProps {
    fontSize: number;
    fontFamily: string;
    background: string;
    scrollMode: boolean;
    onFontSizeChange: (size: number) => void;
    onFontChange: (font: string) => void;
    onBackgroundChange: (bg: string) => void;
    onLayoutChange: (layout: "single" | "double") => void;
    onScrollModeChange: (scroll: boolean) => void;
}

export default function FontMenu({
    fontSize,
    fontFamily,
    background,
    onFontSizeChange,
    onFontChange,
    onBackgroundChange,
    onLayoutChange,
    onScrollModeChange,
}: FontMenuProps) {
    const [layout, setLayout] = useState<"single" | "double">("single");
    const [scrollMode, setScrollMode] = useState(false);

    return (
        <div className="bg-gray-900 text-white w-72 p-4 rounded-xl shadow-lg space-y-4 
                    transition-all duration-200 ease-out origin-top-right animate-in fade-in zoom-in-95">
            {/* Nền */}
            <div>
                <h4 className="font-semibold mb-2">Nền</h4>
                <div className="flex gap-2">
                    {backgrounds.map((c) => (
                        <button
                            key={c}
                            onClick={() => onBackgroundChange(c)}
                            className="w-8 h-8 rounded-lg border-2 flex items-center justify-center"
                            style={{ background: c }}
                        >
                            {background === c && (
                                <IoCheckmark
                                    size={18}
                                    color={c === "#000000" ? "white" : "black"}
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>


            {/* Dàn trang */}
            <div>
                <h4 className="font-semibold mb-2">Dàn trang</h4>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setLayout("single");
                            onLayoutChange?.("single");
                        }}
                        className={`px-3 py-2 rounded ${layout === "single" ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"}`}
                    >
                        ☰
                    </button>
                    <button
                        onClick={() => {
                            setLayout("double");
                            onLayoutChange?.("double");
                        }}
                        className={`px-3 py-2 rounded ${layout === "double" ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"}`}
                    >
                        ☷
                    </button>
                </div>
            </div>

            {/* Cuộn dọc */}
            <div className="flex justify-between items-center">
                <span>Cuộn dọc trang</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={scrollMode}
                        onChange={() => {
                            const newVal = !scrollMode;
                            setScrollMode(newVal);
                            onScrollModeChange?.(newVal);
                        }}
                        className="sr-only"
                    />
                    <div className="w-11 h-6 bg-gray-600 rounded-full transition peer-checked:bg-blue-500">
                        <div
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${scrollMode ? "translate-x-5" : ""
                                }`}
                        />
                    </div>
                </label>
            </div>

            {/* Font size */}
            <div>
                <h4 className="font-semibold mb-2">Cỡ và kiểu chữ</h4>
                <div className="flex gap-2 mb-2">
                    <button
                        onClick={() => onFontSizeChange(Math.max(10, fontSize - 2))}
                        className="px-3 py-1 bg-gray-700 rounded"
                    >
                        A-
                    </button>
                    <button
                        onClick={() => onFontSizeChange(Math.min(40, fontSize + 2))}
                        className="px-3 py-1 bg-gray-700 rounded"
                    >
                        A+
                    </button>
                </div>
                <p className="text-sm text-gray-400">Cỡ hiện tại: {fontSize}px</p>
            </div>

            {/* Font list */}
            <div>
                <div className="space-y-1">
                    {fonts.map((f) => (
                        <button
                            key={f}
                            onClick={() => onFontChange(f)}
                            className={`flex justify-between items-center w-full px-3 py-2 rounded ${fontFamily === f ? "bg-gray-700" : "hover:bg-gray-800"
                                }`}
                            style={{ fontFamily: f !== "Mặc định" ? f : "inherit" }}
                        >
                            {f}
                            {fontFamily === f && <IoCheckmark />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
