import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/design-system/useFocusTrap';

export interface AppDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Centered modal dialog — base for AppConfirm. Focus-trapped, closes on Escape, returns focus on close. */
export function AppDialog({ open, onClose, title, children, footer }: AppDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-black/50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        tabIndex={-1}
        className="w-96 max-w-[calc(100vw-2rem)] rounded-[var(--radius-card-sm)] border border-orbita-border bg-orbita-card p-6 shadow-[var(--shadow-overlay)]"
      >
        <h2 id="app-dialog-title" className="text-[16px] font-semibold text-white">
          {title}
        </h2>
        <div className="mt-2 text-[13px] text-orbita-text-muted">{children}</div>
        {footer && <div className="mt-5 flex gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
