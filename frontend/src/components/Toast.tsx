import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type ToastType = 'info' | 'success' | 'error';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    visible: false
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
    window.setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  }, []);

  const palette: Record<ToastType, string> = useMemo(
    () => ({
      info: 'bg-sky-600 text-white',
      success: 'bg-emerald-600 text-white',
      error: 'bg-red-600 text-white'
    }),
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className={`pointer-events-none fixed top-4 right-4 z-50 w-full max-w-sm rounded-md px-4 py-3 text-sm font-medium shadow transition ${
          toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        } ${palette[toast.type]}`}
      >
        {toast.message}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
