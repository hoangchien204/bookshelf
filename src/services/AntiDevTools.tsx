import { useEffect } from "react";

export default function AntiDevTools() {
  useEffect(() => {
    // Hàm kiểm tra chính - Chạy mỗi 500ms
    const checkDevTools = setInterval(() => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      // 1. ƯU TIÊN KIỂM TRA KÍCH THƯỚC (Cho trường hợp DevTools dính liền)
      if (widthDiff > threshold || heightDiff > threshold) {
        // Nếu phát hiện -> Đá ngay lập tức!
        window.location.href = "https://www.google.com";
        return; // ⛔ Dừng ngay, không chạy xuống đoạn debugger bên dưới nữa
      }

      // 2. NẾU KHÔNG PHÁT HIỆN KÍCH THƯỚC (DevTools tách rời / Undocked)
      // Mới dùng đến "cực hình" debugger để làm lag
      // (function() {}.constructor("debugger")()); 
      // 👆 Tạm thời mình comment dòng này lại để bạn test tính năng "Đá" trước đã.
      // Nếu bạn muốn chặn cả loại tách rời (undocked) thì bỏ comment ra,
      // nhưng chấp nhận là loại tách rời sẽ bị TREO máy thay vì bị ĐÁ.
      
    }, 500);

    // Chặn phím tắt F12...
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        window.location.href = "https://www.google.com"; // Bấm phím tắt cũng đá luôn
      }
    };
    
    // Chặn chuột phải
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      clearInterval(checkDevTools);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return null;
}