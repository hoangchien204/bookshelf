import { useEffect, useRef } from "react";
import DisableDevtool from "disable-devtool";

export default function AntiDevTools() {
  // Dùng ref để đảm bảo hàm nuke chỉ chạy 1 lần duy nhất (tránh loop vô tận)
  const nukedRef = useRef(false);

  useEffect(() => {
    // 1. QUAN TRỌNG: Nếu đang chạy localhost (Dev mode) thì KHÔNG chạy anti-cheat
    // Để bạn còn code được chứ!
    if (import.meta.env.MODE === "development") {
      console.log("AntiDevTools: Disabled in Development Mode");
      return;
    }

    // Hàm Hủy Diệt (Nuclear Option)
    const nukeEverything = () => {
      if (nukedRef.current) return; // Nếu đã nuke rồi thì thôi
      nukedRef.current = true;

      try {
        // A. Xóa sạch DOM ngay lập tức để che code
        document.documentElement.innerHTML = "<h1>⚠️ Security Violation</h1>";
        document.documentElement.style.backgroundColor = "black";
        document.documentElement.style.color = "red";
        document.documentElement.style.display = "flex";
        document.documentElement.style.justifyContent = "center";
        document.documentElement.style.alignItems = "center";
        document.documentElement.style.height = "100vh";

        // B. Dừng mọi hoạt động của React/JS khác (nếu có thể)
        window.stop(); 

        // C. Đá sang Google sau 100ms (Dùng replace để không back lại được)
        setTimeout(() => {
            window.location.replace("https://www.google.com");
        }, 100);
        
      } catch (e) {
        // Fallback nếu có lỗi
        window.location.href = "about:blank";
      }
    };

    // 2. Cấu hình thư viện disable-devtool
    DisableDevtool({
      ondevtoolopen: () => nukeEverything(),
      interval: 500, // Check mỗi 500ms
      disableMenu: true, // Chặn chuột phải
      disableSelect: true, // Chặn bôi đen
      disableCopy: true, // Chặn copy
      disableCut: true, 
      disablePaste: true,
      clearLog: true, // Xóa log liên tục
      url: "about:blank" // URL mặc định nếu thư viện tự redirect
    });

    // 3. Vòng lặp thủ công (Backup layer)
    const intervalId = setInterval(() => {
      // A. Check kích thước (Detect DevTools mở dạng Docked)
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        nukeEverything();
      }

      // B. Kỹ thuật Debugger Trap
      const start = performance.now(); // Dùng performance.now() chính xác hơn new Date()
      // eslint-disable-next-line no-debugger
      debugger; 
      const end = performance.now();

      // C. Logic phát hiện:
      // Nếu thời gian chênh lệch > 100ms (tăng lên chút để tránh máy lag bị oan)
      // Máy bình thường chỉ mất ~0.1ms để qua dòng debugger. 
      // Nếu DevTools mở, nó sẽ khựng lại rất lâu.
      if (end - start > 100) {
        nukeEverything();
      }
    }, 1000); // Check mỗi 1s là đủ, 500ms hơi gắt quá làm nặng máy user

    // Cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return null;
}