import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'success' | 'ghost';

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-orbita-blue text-white hover:bg-orbita-blue-dark disabled:opacity-40 disabled:hover:bg-orbita-blue',
  secondary:
    'bg-orbita-card border border-orbita-border text-white hover:border-orbita-blue/40 disabled:opacity-40',
  success: 'bg-orbita-success text-white hover:brightness-110 disabled:opacity-40',
  ghost: 'text-orbita-text-muted hover:text-white underline-offset-4 hover:underline',
};

/** Primary/Secondary/Publicar/ghost button — visual copied verbatim from the prototype's "Botões e badges" tokens section. */
export function AppButton({ variant = 'primary', className = '', ...props }: AppButtonProps) {
  const base =
    variant === 'ghost'
      ? 'focus-ring inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] text-[13px] font-medium transition disabled:cursor-not-allowed'
      : 'focus-ring inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 py-2.5 text-[14px] font-medium transition disabled:cursor-not-allowed';
  return <button className={`${base} ${VARIANT_CLASSES[variant]} ${className}`} {...props} />;
}
