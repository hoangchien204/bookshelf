import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type ModalContextType = {
  showModal: (message: string) => void;
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

  const showModal = (msg: string) => {
    setMessage(msg);
    setOpen(true);
  };

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 z-[100000]">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-sm">
            <h2 className="text-xl font-bold mb-4">Thông báo</h2>
            <p className="mb-6">{message}</p>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-lg"
              onClick={() => setOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
