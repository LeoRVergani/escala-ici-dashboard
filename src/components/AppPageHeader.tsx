import type { ReactNode } from 'react';

interface AppPageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/** Title + subtitle + action row, reused across Setores/Equipes/Escalas pages. */
export function AppPageHeader({ eyebrow, title, subtitle, action }: AppPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-wide text-orbita-text-faint">{eyebrow}</p>
        )}
        <h1 className="mt-1 text-[20px] font-bold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-orbita-text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
