import type { ReactNode } from 'react';

interface AppEmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/** "Vazio útil" pattern from the prototype's design-system section — e.g. "Nenhuma escala criada ainda". */
export function AppEmptyState({ title, description, action }: AppEmptyStateProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-orbita-border/60 bg-orbita-card p-10 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-[var(--radius-pill)] bg-orbita-elevated text-orbita-text-muted" aria-hidden="true">
        ∅
      </div>
      <p className="mt-4 text-[14px] font-medium text-white">{title}</p>
      {description && <p className="mt-1 text-[13px] text-orbita-text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
