import type { ReactNode } from 'react';

interface OrganizationListProps {
  children: ReactNode;
}

export function OrganizationList({ children }: OrganizationListProps) {
  return (
    <div>
      <h2 className="text-[13px] font-semibold tracking-wide text-orbita-text-faint uppercase">
        Organizações disponíveis
      </h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </div>
  );
}
