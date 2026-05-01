'use client';

import { useState, useEffect, useCallback } from 'react';

type ToastType = 'error' | 'success' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const bgColor: Record<ToastType, string> = {
  error: 'bg-red-600',
  success: 'bg-green-600',
  info: 'bg-zinc-600',
};

function Toast({ item, onClose }: { item: ToastItem; onClose: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(item.id), 5000);
    return () => clearTimeout(timer);
  }, [item.id, onClose]);

  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-lg text-white shadow-lg ${bgColor[item.type]} max-w-sm`}
    >
      <span className="flex-1 text-sm">{item.message}</span>
      <button
        onClick={() => onClose(item.id)}
        className="text-white/70 hover:text-white text-lg leading-none"
      >
        ✕
      </button>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  let nextId = 0;

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const closeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} item={t} onClose={closeToast} />
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}
