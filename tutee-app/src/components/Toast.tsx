/* eslint-disable @typescript-eslint/no-unused-vars */
// components/ui/Toast.tsx
"use client";

import { useState, useEffect, createContext, useContext } from "react";

type ToastType = 'success' | 'error';
type Toast = { id: number; message: string; type: ToastType };

const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000); // auto-dismiss
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] space-y-2">
        {toasts.map(({ id, message, type }) => (
          <div
            key={id}
            className={`px-4 py-2 rounded shadow-md text-sm font-medium text-white animate-fadeInOut
              ${type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}
          >
            {message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
