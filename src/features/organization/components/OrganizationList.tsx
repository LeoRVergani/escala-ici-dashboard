import type { ReactNode } from 'react';

interface OrganizationListProps {
  children: ReactNode;
}

export function OrganizationList({ children }: OrganizationListProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-orbita-border/50 pb-2">
        <h2 className="text-[13px] font-semibold tracking-wide text-orbita-text-faint uppercase">
          Organizações disponíveis
        </h2>
        <span className="shrink-0 text-[11px] text-orbita-text-faint">Atualizado agora</span>
      </div>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}
