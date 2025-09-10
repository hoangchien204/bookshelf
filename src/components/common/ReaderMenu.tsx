import { useState } from "react";
import { FiX } from "react-icons/fi";

interface ReaderMenuProps {
    toc: { label: string; href: string }[];
    notes: { id: string; cfiRange: string; note?: string; color?: string }[];
    onClose: () => void;
    onSelectChapter: (href: string) => void;
    onSelectNote: (cfiRange: string) => void;
}

export default function ReaderMenu({
    toc,
    notes,
    onClose,
    onSelectChapter,
    onSelectNote,
}: ReaderMenuProps) {
    const [activeTab, setActiveTab] = useState<"toc" | "notes">("toc");

    return (
        <div className="fixed top-12 right-0 w-72 h-[calc(100%-56px)] 
             bg-gray-800 text-white shadow-lg z-[30000] 
             flex flex-col border-l border-gray-700/50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-300">
                    Danh sách
                </h3>
                <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-full bg-white text-gray-800 flex items-center justify-center hover:bg-red-500 hover:text-white transition"
                >
                    <FiX size={16} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700 text-sm">
                <button
                    onClick={() => setActiveTab("toc")}
                    className={`flex-1 py-2 font-medium transition ${activeTab === "toc"
                            ? "text-green-400 border-b-2 border-green-400"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                >
                    Mục lục
                </button>
                <button
                    onClick={() => setActiveTab("notes")}
                    className={`flex-1 py-2 font-medium transition ${activeTab === "notes"
                            ? "text-green-400 border-b-2 border-green-400"
                            : "text-gray-400 hover:text-gray-200"
                        }`}
                >
                    Ghi chú
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-sm scrollbar-thin scrollbar-thumb-gray-700/50">
                {activeTab === "toc" && toc.length > 0 && (
                    <ul className="space-y-1">
                        {toc.map((item, i) => (
                            <li
                                key={i}
                                onClick={() => onSelectChapter(item.href)}
                                className="cursor-pointer px-2 py-1 rounded hover:bg-gray-700 truncate"
                            >
                                {item.label}
                            </li>
                        ))}
                    </ul>
                )}

                {activeTab === "notes" && (
                    <ul className="space-y-2">
                        {notes.length === 0 && (
                            <p className="text-gray-400 italic">Chưa có ghi chú nào.</p>
                        )}
                        {notes.map((n) => (
                            <li
                                key={n.id}
                                onClick={() => onSelectNote(n.cfiRange)}
                                className="cursor-pointer p-2 rounded bg-gray-700/50 hover:bg-gray-700 flex items-center justify-between"
                            >
                                <span className="truncate">{n.note || "Không có nội dung"}</span>
                                <span
                                    className="w-3 h-3 rounded-full ml-2 shrink-0"
                                    style={{ background: n.color || "yellow" }}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
