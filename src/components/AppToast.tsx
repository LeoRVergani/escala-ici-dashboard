import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AppIcon, type AppIconName, type AppIconTone } from './AppIcon';

type ToastTone = 'success' | 'info' | 'error';

interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'border-orbita-success/40 bg-orbita-card text-orbita-success',
  info: 'border-orbita-border bg-orbita-card text-white',
  error: 'border-orbita-danger/40 bg-orbita-card text-orbita-danger',
};

const TONE_ICON: Record<ToastTone, AppIconName> = {
  success: 'checkCircle',
  info: 'info',
  error: 'error',
};

const TONE_ICON_TONE: Record<ToastTone, AppIconTone> = {
  success: 'success',
  info: 'muted',
  error: 'danger',
};

let idCounter = 0;

/** Toast notification system — used for save/publish/member-change confirmations. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = `toast-${(idCounter += 1)}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite" aria-atomic="true">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              className={`flex items-start gap-2 rounded-[var(--radius-control)] border px-4 py-2.5 text-[13px] shadow-[var(--shadow-overlay)] ${TONE_CLASSES[toast.tone]}`}
            >
              <AppIcon name={TONE_ICON[toast.tone]} size={16} tone={TONE_ICON_TONE[toast.tone]} className="mt-0.5" />
              <span>{toast.message}</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
