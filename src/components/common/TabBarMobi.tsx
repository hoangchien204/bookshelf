import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiChevronLeft, FiHome } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface TabBarProps {
  bookTitle: string;
  onBack: () => void;
  onLike: () => void;
  onShare: () => void;
}

export default function MobileTabBar({ bookTitle, onBack }: TabBarProps) {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      className={`fixed top-0 left-0 w-full flex items-center justify-between px-4 h-14 z-50 transition-colors duration-300 ${
        scrolled ? "bg-black/90 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <button onClick={onBack} className="text-white">
        <FiChevronLeft size={22} />
      </button>

      {scrolled && (
        <span className="text-white font-semibold truncate max-w-[60%] text-center">
          {bookTitle}
        </span>
      )}

      <div className="flex items-center gap-4 text-white">
    <button onClick={() => navigate("/")}>
          <FiHome  size={20} />
        </button>
      </div>
    </motion.div>
  );
}
