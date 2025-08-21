// src/components/ToastProvider.tsx
import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-left"
      toastOptions={{
        style: {
          background: "#333",
          color: "#fff",
          borderRadius: "8px",
          padding: "10px 16px",
        },
        success: {
          style: { background: "#16a34a" },
        },
        error: {
          style: { background: "#dc2626" },
        },
      }}
    />
  );
}
