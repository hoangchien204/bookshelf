import React, { useEffect } from "react";
import { FiMaximize, FiMinimize } from "react-icons/fi";

interface Props {
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
}

const ZoomControls: React.FC<Props> = ({ isFullscreen, setIsFullscreen }) => {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Sync khi user bấm F11 hoặc ESC
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, [setIsFullscreen]);

  return (
    <button
      onClick={toggleFullscreen}
      className="px-3 py-1 bg-gray-200 rounded"
    >
      {isFullscreen ? <FiMinimize /> : <FiMaximize />}
    </button>
  );
};

export default ZoomControls;
