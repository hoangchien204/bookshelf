import { useEffect } from "react";

export default function AntiDevTools() {
  useEffect(() => {
    const triggerBan = () => {
      document.body.innerHTML = "<h1>⚠️ Don't try to inspect this page!</h1>";
      document.body.style.backgroundColor = "black";
      document.body.style.color = "red";
      document.body.style.textAlign = "center";
      document.body.style.paddingTop = "20%";

      setTimeout(() => {
        window.location.replace("https://www.google.com");
      }, 200);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey; // Ctrl (Win) hoặc Command (Mac)

      if (
        e.key === "F12" || // F12
        (isCtrlOrMeta && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) || // Ctrl+Shift+I/J/C
        (isCtrlOrMeta && e.key.toUpperCase() === "U") || // Ctrl+U (Xem source)
        (isCtrlOrMeta && e.key.toUpperCase() === "S") // Ctrl+S (Lưu trang)
      ) {
        e.preventDefault();
        e.stopPropagation();
        triggerBan();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const intervalId = setInterval(() => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      if (widthDiff > threshold || heightDiff > threshold) {
        triggerBan();
      }

      const start = performance.now();
      debugger; 
      const end = performance.now();

      if (end - start > 100) {
        triggerBan();
      }
    }, 1000); 

    // Đăng ký sự kiện
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
      clearInterval(intervalId);
    };
  }, []);

  return null;
}