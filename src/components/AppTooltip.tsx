import { useId, useState, type ReactElement } from 'react';
import { cloneElement } from 'react';

interface AppTooltipProps {
  label: string;
  children: ReactElement<Record<string, unknown>>;
}

/** Hover/focus tooltip — wraps an icon button and adds a described-by label without changing its visual. */
export function AppTooltip({ label, children }: AppTooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  const trigger = cloneElement(children, {
    'aria-describedby': id,
    onMouseEnter: () => setVisible(true),
    onMouseLeave: () => setVisible(false),
    onFocus: () => setVisible(true),
    onBlur: () => setVisible(false),
  });

  return (
    <span className="relative inline-flex">
      {trigger}
      {visible && (
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-control)] border border-orbita-border bg-orbita-elevated px-2 py-1 text-[11px] text-white"
        >
          {label}
        </span>
      )}
    </span>
  );
}
