import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import { Header } from '@/app/Header';
import { AppCard } from '@/components/AppCard';
import { AppBadge } from '@/components/AppBadge';
import { AppButton } from '@/components/AppButton';
import { AppPageHeader } from '@/components/AppPageHeader';
import { AppLoadingState } from '@/components/AppLoadingState';
import { AppAlert } from '@/components/AppAlert';
import { useOrganizationRepository, useScheduleRepository } from '@/app/services';
import type { Sector } from '@/domain/sector';
import type { Team } from '@/domain/team';
import type { Schedule } from '@/domain/schedule';
import { formatPeriod, formatDateTime } from '@/lib/format';

interface TeamRow {
  team: Team;
  published: Schedule | null;
  draft: Schedule | null;
}

export function TeamsPage() {
  const { sectorId } = useParams<{ sectorId: string }>();
  const organizationRepository = useOrganizationRepository();
  const scheduleRepository = useScheduleRepository();
  const [sector, setSector] = useState<Sector | null | undefined>(undefined);
  const [rows, setRows] = useState<TeamRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void organizationRepository.getSector(sectorId).then((s) => {
      if (!cancelled) setSector(s);
    });
    void organizationRepository.listTeamsBySector(sectorId).then(async (teams) => {
      const withSchedules = await Promise.all(
        teams.map(async (team) => ({
          team,
          published: await scheduleRepository.getPublishedByTeam(team.id),
          draft: await scheduleRepository.getDraftByTeam(team.id),
        })),
      );
      if (!cancelled) setRows(withSchedules);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationRepository, scheduleRepository, sectorId]);

  return (
    <div className="min-h-screen bg-orbita-bg">
      <Header breadcrumb={sector ? { sectorCode: sector.code } : undefined} />
      <main className="mx-auto max-w-4xl px-6 py-10">
        {sector === null && <AppAlert tone="error">Setor não encontrado.</AppAlert>}
        <AppPageHeader
          eyebrow={sector ? `${sector.code} • ${sector.name}` : undefined}
          title="Escolha a equipe que deseja gerenciar."
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows === null && <AppLoadingState />}
          {rows?.map(({ team, published, draft }) => {
            const active = published ?? draft;
            return (
              <AppCard key={team.id} className="p-5" data-team-id={team.id}>
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
                  <div className="mt-2 space-y-0.5 text-[12px] text-orbita-text-muted">
                    <p>Período atual: {formatPeriod(active.periodStart, active.periodEnd)}</p>
                    <p>Última atualização: {formatDateTime(active.updatedAt)}</p>
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
          })}
        </div>
      </main>
    </div>
  );
}
