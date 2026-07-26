import type { ReactNode } from 'react';

interface AppPageHeaderProps {
  eyebrow?: string;
  eyebrowTone?: 'muted' | 'accent';
  title: string;
  size?: 'default' | 'lg';
  subtitle?: string;
  metadata?: ReactNode;
  action?: ReactNode;
}

/** Title + subtitle + action row, reused across Setores/Equipes/Escalas/Organizações pages. */
export function AppPageHeader({
  eyebrow,
  eyebrowTone = 'muted',
  title,
  size = 'default',
  subtitle,
  metadata,
  action,
}: AppPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow && (
          <p
            className={`text-[11px] font-medium uppercase ${
              eyebrowTone === 'accent' ? 'tracking-widest text-orbita-blue' : 'tracking-wide text-orbita-text-faint'
            }`}
          >
            {eyebrow}
          </p>
        )}
        <h1 className={`mt-1 font-bold text-white ${size === 'lg' ? 'text-[28px]' : 'text-[20px]'}`}>{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-orbita-text-muted">{subtitle}</p>}
      </div>
      {(metadata || action) && (
        <div className="flex flex-col items-end gap-2">
          {metadata}
          {action}
        </div>
      )}
    </div>
  );
}
