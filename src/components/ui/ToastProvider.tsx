import React, { createContext, useContext, useState, useCallback } from 'react';
import { SunflowerIcon } from '../SunflowerIcon';

export type ToastType = 'success' | 'error' | 'info';

interface ToastContextValue {
  toast: (message: string, type?: ToastType, ttl?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType | null>(null);

  const toast = useCallback((message: string, type: ToastType = 'info', ttl = 3000) => {
    setToastMsg(message);
    setToastType(type);
    window.setTimeout(() => {
      setToastMsg(null);
      setToastType(null);
    }, ttl);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {toastMsg && (
        <div className="fixed top-6 right-6 z-50" role="status" aria-live="polite">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg max-w-sm w-full text-sm ${
              toastType === 'success'
                ? 'bg-green-50 border border-green-100 text-green-800'
                : toastType === 'error'
                ? 'bg-red-50 border border-red-100 text-red-700'
                : 'bg-gray-50 border border-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <SunflowerIcon className="w-5 h-5 text-yellow-400" />
              <div>{toastMsg}</div>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
