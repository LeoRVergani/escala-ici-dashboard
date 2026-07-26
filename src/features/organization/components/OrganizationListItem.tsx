import { Link } from 'wouter';
import { AppCard } from '@/components/AppCard';
import { AppBadge } from '@/components/AppBadge';
import { AppButton } from '@/components/AppButton';
import { AppIcon } from '@/components/AppIcon';
import type { Organization } from '@/domain/organization';
import type { AppIconName } from '@/components/AppIcon';

interface OrganizationListItemProps {
  organization: Organization;
  roleLabel: string;
  authorizedSectorsCount: number;
  lastActivityLabel: string;
}

function MetricColumn({ icon, label, value }: { icon: AppIconName; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <AppIcon name={icon} size={16} tone="muted" className="mt-0.5" />
      <div>
        <p className="text-[10px] font-semibold tracking-widest text-orbita-text-faint uppercase">{label}</p>
        <p className="mt-0.5 text-[13px] font-medium text-white">{value}</p>
      </div>
    </div>
  );
}

export function OrganizationListItem({
  organization,
  roleLabel,
  authorizedSectorsCount,
  lastActivityLabel,
}: OrganizationListItemProps) {
  const sectorsLabel = `${authorizedSectorsCount} setor${authorizedSectorsCount === 1 ? '' : 'es'} autorizado${
    authorizedSectorsCount === 1 ? '' : 's'
  }`;

  return (
    <AppCard
      style={{ minHeight: 'var(--size-list-item-min-height)' }}
      className="flex flex-col gap-4 border-l-4 border-l-orbita-blue p-5 lg:flex-row lg:items-center lg:justify-between"
      data-organization-id={organization.id}
    >
      <div className="flex min-w-0 items-center gap-3 lg:w-64 lg:shrink-0">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-control)] bg-gradient-to-br from-orbita-blue to-orbita-violet-dark text-[12px] font-bold text-white">
          {organization.code}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-white">{organization.name}</h3>
          {organization.description && (
            <p className="truncate text-[12px] text-orbita-text-muted">{organization.description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:flex-1 lg:border-x lg:border-orbita-border/50 lg:px-6">
        <MetricColumn icon="users" label="Função" value={roleLabel} />
        <MetricColumn icon="building" label="Setores autorizados" value={sectorsLabel} />
        <MetricColumn icon="clock" label="Última atividade" value={lastActivityLabel} />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <AppBadge tone={organization.active ? 'success' : 'neutral'}>
          {organization.active ? 'Ativa' : 'Inativa'}
        </AppBadge>
        {/* Only one organization exists today, so "opening" it means its sectors — the existing /setores route,
            now filtered by the signed-in user's authorization. A future multi-org checkpoint can scope this per-org. */}
        <Link href="/setores">
          <AppButton variant="secondary" className="flex items-center gap-1.5">
            Abrir organização <AppIcon name="arrowRight" size={16} />
          </AppButton>
        </Link>
      </div>
    </AppCard>
  );
}
