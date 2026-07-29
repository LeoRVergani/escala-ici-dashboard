import { useId, useRef, useState, type ReactNode } from 'react';
import { AppIcon } from './AppIcon';

interface AppDisclosureProps {
  label: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

/** Generic disclosure/accordion trigger — powers "Acessar ambiente de teste" on the login access panel. */
export function AppDisclosure({ label, children, defaultOpen = false }: AppDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="focus-ring flex w-full cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-control)] py-1 text-[12px] text-orbita-text-faint transition hover:text-orbita-text-muted disabled:cursor-not-allowed"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex items-center gap-2">{label}</span>
        <span className={`transition-transform duration-[var(--duration-base)] ${open ? 'rotate-180' : ''}`}>
          <AppIcon name="chevronDown" size={16} tone="muted" />
        </span>
      </button>
      {open && (
        <div id={contentId} className="mt-3">
          {children}
        </div>
      )}
    </div>
  );
}
