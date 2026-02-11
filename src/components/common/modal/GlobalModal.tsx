import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react"

type ModalType = "success" | "error";

type ModalContextType = {
  showModal: (message: string, type?: ModalType) => void;
  notiFication: (message: string, type?: ModalType) => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useGlobalModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useGlobalModal must be used within ModalProvider");
  return ctx;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ModalType>("success");

  const showModal = (msg: string, modalType: ModalType = "success") => {
    setMessage(msg);
    setType(modalType);
    setOpen(true);
  };

  return (
    <ModalContext.Provider value={{ showModal, notiFication: showModal }}>
      {children}

      {open && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[100000] animate-fadeIn"
        >
          <div
            className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full transform animate-scaleIn relative"
          >
            {/* Icon thay đổi theo trạng thái */}
            <div className="flex justify-center mb-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center animate-pop ${
                  type === "success" ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {type === "success" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>
            </div>

            <h2
              className={`text-2xl font-extrabold mb-2 ${
                type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {type === "success" ? "Thành công" : "Lỗi"}
            </h2>

            <p className="text-gray-600 mb-6 px-4">{message}</p>

            <button
              onClick={() => setOpen(false)}
              className={`px-6 py-2 font-semibold rounded-full transition-all duration-300 hover:scale-105 active:scale-95 ${
                type === "success"
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
