'use client';

import { useEffect } from 'react';

export default function Modal({ title, open, onClose, children, width = 'max-w-xl' }) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div
        className={`w-full ${width} rounded-3xl border border-indigo-100/70 bg-white/95 p-6 shadow-xl`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#3f3d56]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500 hover:bg-indigo-50"
          >
            Close
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}

