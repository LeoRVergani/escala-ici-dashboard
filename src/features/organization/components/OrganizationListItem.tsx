import { Link } from 'wouter';
import { AppCard } from '@/components/AppCard';
import { AppBadge } from '@/components/AppBadge';
import { AppButton } from '@/components/AppButton';
import { Icon } from '@/design-system/icons';
import type { Organization } from '@/domain/organization';

interface OrganizationListItemProps {
  organization: Organization;
  roleLabel: string;
  authorizedSectorsCount: number;
  lastActivityLabel: string;
}

export function OrganizationListItem({
  organization,
  roleLabel,
  authorizedSectorsCount,
  lastActivityLabel,
}: OrganizationListItemProps) {
  return (
    <AppCard
      className="flex flex-col gap-4 border-l-4 border-l-orbita-blue p-5 sm:flex-row sm:items-center sm:justify-between"
      data-organization-id={organization.id}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-gradient-to-br from-orbita-blue to-orbita-violet-dark text-[12px] font-bold text-white">
          {organization.code}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold text-white">{organization.name}</h3>
            <AppBadge tone={organization.active ? 'success' : 'neutral'}>
              {organization.active ? 'Ativa' : 'Inativa'}
            </AppBadge>
          </div>
          {organization.description && <p className="text-[12px] text-orbita-text-muted">{organization.description}</p>}
          <p className="mt-1 text-[12px] text-orbita-text-faint">
            {roleLabel} · {authorizedSectorsCount} setor{authorizedSectorsCount === 1 ? '' : 'es'} autorizado
            {authorizedSectorsCount === 1 ? '' : 's'} · {lastActivityLabel}
          </p>
        </div>
      </div>

      {/* Only one organization exists today, so "opening" it means its sectors — the existing /setores route,
          now filtered by the signed-in user's authorization. A future multi-org checkpoint can scope this per-org. */}
      <Link href="/setores" className="shrink-0">
        <AppButton variant="secondary">
          Abrir organização <span aria-hidden="true">{Icon.arrowRight}</span>
        </AppButton>
      </Link>
    </AppCard>
  );
}
