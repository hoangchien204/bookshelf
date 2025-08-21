import React, { useState, useRef, useEffect } from "react";
import { FiLayout, FiCheck } from "react-icons/fi";

interface ViewModeSwitcherProps {
  mode: "single" | "double" | "scroll";
  onChange: (mode: "single" | "double" | "scroll") => void;
}

const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({ mode, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 📌 Đóng khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderItem = (label: string, value: "single" | "double" | "scroll", icon: string) => (
    <button
      key={value}
      onClick={() => {
        onChange(value);
        setOpen(false);
      }}
      className={`w-full flex justify-between items-center px-3 py-2 rounded text-sm ${
        mode === value ? "bg-blue-500 text-white" : "hover:bg-gray-100"
      }`}
    >
      <span>
        {icon} {label}
      </span>
      {mode === value && <FiCheck />}
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      {/* Icon mở menu */}
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 rounded hover:bg-gray-200 ${
          open ? "bg-gray-200" : ""
        }`}
      >
        <FiLayout size={20} />
      </button>

      {/* Dropdown */}
      {open && (
  <div className="absolute right-0 mt-2 w-52 bg-white shadow-lg rounded-lg border p-2 z-[20000]">
    <h4 className="text-sm font-semibold mb-2">Chế độ xem</h4>
    <div className="space-y-1">
      {renderItem("1 Trang", "single", "📄")}
      {renderItem("2 Trang", "double", "📑")}
      {renderItem("Cuộn dọc", "scroll", "📜")}
    </div>
  </div>
)}
    </div>
  );
};

export default ViewModeSwitcher;
