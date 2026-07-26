import { AppCard } from '@/components/AppCard';
import type { Organization } from '@/domain/organization';

interface OrganizationSummaryCardProps {
  organization: Organization;
  index: number;
  sectorsTotal: number;
  authorizedTeamsCount: number;
  draftsCount: number;
}

/** Authorship (createdBy*) is deliberately never shown here — it belongs only to org settings + the audit log. */
export function OrganizationSummaryCard({
  organization,
  index,
  sectorsTotal,
  authorizedTeamsCount,
  draftsCount,
}: OrganizationSummaryCardProps) {
  return (
    <AppCard className="p-8" data-organization-summary-id={organization.id}>
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-orbita-border bg-orbita-elevated px-2.5 py-1 text-[10px] font-semibold tracking-widest text-orbita-text-faint uppercase">
          Organizações autorizadas
        </span>
        <span
          aria-hidden="true"
          className="leading-none font-bold text-orbita-border/70"
          style={{ fontSize: 'var(--size-decorative-number)' }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <p className="mt-5 text-[11px] font-medium tracking-wide text-orbita-text-faint uppercase">{organization.code}</p>
      <h2 className="mt-1 text-[28px] font-bold text-white">{organization.name}</h2>
      {organization.description && <p className="mt-1 text-[14px] text-orbita-text-muted">{organization.description}</p>}
      <p className="mt-3 text-[13px] text-orbita-text-muted">
        Você pode acessar os setores e equipes autorizados nesta organização.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="rounded-[var(--radius-control)] border border-orbita-border/60 bg-orbita-elevated px-4 py-3">
          <p className="text-[22px] font-bold text-white">{String(sectorsTotal).padStart(2, '0')}</p>
          <p className="text-[11px] text-orbita-text-muted">setores cadastrados</p>
        </div>
        <div className="rounded-[var(--radius-control)] border border-orbita-border/60 bg-orbita-elevated px-4 py-3">
          <p className="text-[22px] font-bold text-white">{authorizedTeamsCount}</p>
          <p className="text-[11px] text-orbita-text-muted">equipes autorizadas</p>
        </div>
        {draftsCount > 0 && (
          <div className="rounded-[var(--radius-control)] border border-orbita-warning/40 bg-orbita-warning/10 px-4 py-3">
            <p className="text-[22px] font-bold text-orbita-warning">{draftsCount}</p>
            <p className="text-[11px] text-orbita-warning/80">
              rascunho{draftsCount > 1 ? 's' : ''} ativo{draftsCount > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      <div
        aria-hidden="true"
        className="mt-6 h-1 rounded-[var(--radius-pill)] bg-gradient-to-r from-orbita-blue via-orbita-warning to-orbita-success"
      />
    </AppCard>
  );
}
