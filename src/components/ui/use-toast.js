import React, { createContext, useContext, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = ({ title, description, variant = 'default', duration = 3000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, description, variant, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Toast Component
const Toast = ({ id, title, description, variant, duration, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(), duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const variants = {
    default: 'bg-slate-900 text-white border-slate-800',
    destructive: 'bg-red-600 text-white border-red-500',
    success: 'bg-green-600 text-white border-green-500',
  };

  return (
    <div
      className={cn(
        'flex max-w-md flex-col rounded-md border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-4',
        variants[variant] || variants.default
      )}
    >
      {title && <div className="text-sm font-medium">{title}</div>}
      {description && <div className="mt-1 text-xs">{description}</div>}
      <button
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded-full p-1 hover:bg-white/20 focus:outline-none"
      >
        <span className="sr-only">Close</span>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

// Hook to use toast
const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast function
const toast = ({ title, description, variant, duration }) => {
  const { addToast } = useToast();
  addToast({ title, description, variant, duration });
};

export { ToastProvider, useToast, toast };