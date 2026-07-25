import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/design-system/useFocusTrap';

export interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Side panel sliding in from the right — used for the "manage collaborators" list. */
export function AppDrawer({ open, onClose, title, children }: AppDrawerProps) {
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
      className="fixed inset-0 z-40 bg-black/50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-drawer-title"
        tabIndex={-1}
        className="absolute right-0 top-0 h-full w-80 max-w-[calc(100vw-2rem)] border-l border-orbita-border bg-orbita-card p-4 shadow-[var(--shadow-overlay)]"
      >
        <div className="flex items-center justify-between">
          <h2 id="app-drawer-title" className="text-[14px] font-semibold text-white">
            {title}
          </h2>
          <button
            aria-label="Fechar"
            onClick={onClose}
            className="focus-ring grid h-7 w-7 place-items-center rounded-[var(--radius-pill)] text-orbita-text-muted hover:bg-orbita-elevated hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
