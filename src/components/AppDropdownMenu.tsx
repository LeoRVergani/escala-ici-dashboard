import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

export interface AppDropdownTriggerProps {
  ref: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  'aria-haspopup': true;
  'aria-expanded': boolean;
}

export interface AppDropdownMenuProps {
  trigger: (props: AppDropdownTriggerProps) => ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
}

/** Generic dropdown menu — powers "Mais ações" and the user/avatar menu. Closes on Escape/outside click, returns focus to the trigger. */
export function AppDropdownMenu({ trigger, children, align = 'right' }: AppDropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [open]);

  return (
    <div className="relative">
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((o) => !o),
        'aria-haspopup': true,
        'aria-expanded': open,
      })}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={`absolute top-11 z-30 w-56 rounded-[var(--radius-card-sm)] border border-orbita-border bg-orbita-card p-1 shadow-[var(--shadow-overlay)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function AppDropdownItem({
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      role="menuitem"
      className={`focus-ring w-full rounded-[var(--radius-control)] px-3 py-2 text-left text-[13px] text-white transition hover:bg-orbita-elevated disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}
