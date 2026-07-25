import type { ButtonHTMLAttributes } from 'react';

type Variant = 'ghost' | 'bordered';

export interface AppIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
  size?: 'sm' | 'md';
}

const VARIANT_CLASSES: Record<Variant, string> = {
  // Bell / avatar-adjacent icon buttons in the header — borderless, round.
  ghost: 'rounded-[var(--radius-pill)] text-orbita-text-muted hover:bg-orbita-elevated hover:text-white',
  // Toolbar icon buttons (undo/redo) — bordered, softly rounded square.
  bordered:
    'rounded-[var(--radius-control)] border border-orbita-border text-white hover:bg-orbita-elevated disabled:opacity-30',
};

/** Icon-only button (bell, undo/redo…). Always requires an accessible `label`. */
export function AppIconButton({ label, variant = 'ghost', size = 'md', className = '', ...props }: AppIconButtonProps) {
  const dimension = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  return (
    <button
      aria-label={label}
      title={label}
      className={`focus-ring grid ${dimension} shrink-0 place-items-center transition disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
