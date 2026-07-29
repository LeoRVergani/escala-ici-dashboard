import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'success' | 'ghost';

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-orbita-blue text-white hover:bg-orbita-blue-dark hover:shadow-[0_0_0_1px_rgba(96,165,250,0.45)] disabled:opacity-40 disabled:hover:bg-orbita-blue disabled:hover:shadow-none',
  secondary:
    'border border-orbita-border bg-orbita-card text-white hover:border-orbita-blue/60 hover:bg-orbita-elevated hover:shadow-[0_0_0_1px_rgba(96,165,250,0.35)] disabled:opacity-40 disabled:hover:border-orbita-border disabled:hover:bg-orbita-card disabled:hover:shadow-none',
  success:
    'bg-orbita-success text-white hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(34,197,94,0.35)] disabled:opacity-40 disabled:hover:shadow-none',
  ghost: 'text-orbita-text-muted hover:text-white underline-offset-4 hover:underline disabled:opacity-40',
};

/** Primary/Secondary/Publicar/ghost button — visual copied verbatim from the prototype's "Botões e badges" tokens section. */
export function AppButton({ variant = 'primary', className = '', ...props }: AppButtonProps) {
  const base =
    variant === 'ghost'
      ? 'focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] text-[13px] font-medium transition disabled:cursor-not-allowed'
      : 'focus-ring inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 py-2.5 text-[14px] font-medium transition disabled:cursor-not-allowed';
  return <button className={`${base} ${VARIANT_CLASSES[variant]} ${className}`} {...props} />;
}
