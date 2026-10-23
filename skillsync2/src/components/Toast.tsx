import React from 'react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed left-1/2 bottom-5 -translate-x-1/2 z-50 bg-[#0f1b3d] text-white px-5 py-2.5 rounded-xl shadow-2xl text-sm font-medium transition-opacity animate-in fade-in duration-200 max-w-[90vw] text-center"
    >
      {message}
    </div>
  );
};
