"use client";
import { createContext, useContext, useState } from "react";

export const ToastContext = createContext({
  showToast: (msg: string, type: "error" | "success" = "error") => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"error" | "success">("error");
  const [visible, setVisible] = useState(false);

  function showToast(msg: string, t: "error" | "success" = "error") {
    setMessage(msg);
    setType(t);
    setVisible(true);
    setTimeout(() => setVisible(false), 10000); // 10 seconds
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded shadow text-white ${type === "error" ? "bg-red-500" : "bg-green-500"}`}>
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
