import { Link } from 'wouter';
import { AppCard } from '@/components/AppCard';
import { AppBadge } from '@/components/AppBadge';
import { AppButton } from '@/components/AppButton';
import { AppIcon } from '@/components/AppIcon';
import type { Team } from '@/domain/team';
import type { Schedule } from '@/domain/schedule';
import { formatPeriod, formatDateTime } from '@/lib/format';

interface TeamListItemProps {
  team: Team;
  published: Schedule | null;
  draft: Schedule | null;
}

export function TeamListItem({ team, published, draft }: TeamListItemProps) {
  const active = published ?? draft;

  return (
    <AppCard className="p-5" data-team-id={team.id}>
      <div className="flex items-start justify-between">
        <span className="text-[11px] text-orbita-text-faint">
          {team.scheduleType === 'PLANTAO_COSI' ? 'Escala de plantão' : 'Escala 6×1'}
        </span>
        {published && <AppBadge tone="success">Publicado</AppBadge>}
        {!published && draft && <AppBadge tone="warning">Rascunho</AppBadge>}
        {!published && !draft && <AppBadge tone="neutral">Sem escala</AppBadge>}
      </div>
      <h2 className="mt-2 text-[16px] font-semibold text-white">{team.name}</h2>
      {active ? (
        <div className="mt-2 space-y-1 text-[12px] text-orbita-text-muted">
          <p className="flex items-center gap-1.5">
            <AppIcon name="calendar" size={14} tone="muted" />
            Período atual: {formatPeriod(active.periodStart, active.periodEnd)}
          </p>
          <p className="flex items-center gap-1.5">
            <AppIcon name="clock" size={14} tone="muted" />
            Última atualização: {formatDateTime(active.updatedAt)}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-orbita-text-muted">Nenhuma escala criada ainda.</p>
      )}
      <Link href={`/equipes/${team.id}/escalas`} className="mt-4 block">
        <AppButton variant="secondary" className="w-full">
          Abrir equipe
        </AppButton>
      </Link>
    </AppCard>
  );
}
