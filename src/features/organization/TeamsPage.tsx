import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import { Header } from '@/app/Header';
import { AppButton } from '@/components/AppButton';
import { AppPageHeader } from '@/components/AppPageHeader';
import { AppLoadingState } from '@/components/AppLoadingState';
import { AppAlert } from '@/components/AppAlert';
import { useAuth } from '@/app/auth';
import { useOrganizationRepository, useScheduleRepository } from '@/app/services';
import type { Sector } from '@/domain/sector';
import type { Team } from '@/domain/team';
import type { Schedule } from '@/domain/schedule';
import type { UserAuthorization } from '@/domain/membership';
import { isSectorAuthorized, filterAuthorizedTeams } from '@/domain/authorization';
import { TeamListItem } from './components/TeamListItem';

interface TeamRow {
  team: Team;
  published: Schedule | null;
  draft: Schedule | null;
}

export function TeamsPage() {
  const { sectorId } = useParams<{ sectorId: string }>();
  const { user } = useAuth();
  const organizationRepository = useOrganizationRepository();
  const scheduleRepository = useScheduleRepository();
  const [sector, setSector] = useState<Sector | null | undefined>(undefined);
  const [authorization, setAuthorization] = useState<UserAuthorization | null | undefined>(undefined);
  const [rows, setRows] = useState<TeamRow[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void organizationRepository.getSector(sectorId).then(async (s) => {
      if (cancelled) return;
      setSector(s);
      if (!s) return;
      const auth = await organizationRepository.getAuthorization(user.id, s.organizationId);
      if (!cancelled) setAuthorization(auth);
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
  }, [organizationRepository, scheduleRepository, sectorId, user]);

  if (sector === null) {
    return (
      <div className="min-h-screen bg-orbita-bg">
        <Header />
        <main className="mx-auto max-w-4xl px-6 py-10">
          <AppAlert tone="error">Setor não encontrado.</AppAlert>
        </main>
      </div>
    );
  }

  const authorized = sector && authorization !== undefined ? isSectorAuthorized(sector.id, authorization ?? null) : undefined;

  if (authorized === false) {
    return (
      <div className="min-h-screen bg-orbita-bg">
        <Header breadcrumb={{ sectorCode: sector!.code }} />
        <main className="mx-auto max-w-4xl px-6 py-10">
          <AppAlert tone="error">Você não possui acesso a este setor.</AppAlert>
          <Link href="/organizacoes" className="mt-4 inline-block">
            <AppButton variant="secondary">Voltar às organizações autorizadas</AppButton>
          </Link>
        </main>
      </div>
    );
  }

  const authorizedRows =
    authorization !== undefined && rows
      ? rows.filter((row) => filterAuthorizedTeams([row.team], authorization ?? null).length > 0)
      : null;

  return (
    <div className="min-h-screen bg-orbita-bg">
      <Header breadcrumb={sector ? { sectorCode: sector.code } : undefined} />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <AppPageHeader
          eyebrow={sector ? `${sector.code} • ${sector.name}` : undefined}
          title="Escolha a equipe que deseja gerenciar."
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(authorizedRows === null || authorized === undefined) && <AppLoadingState />}
          {authorizedRows?.map(({ team, published, draft }) => (
            <TeamListItem key={team.id} team={team} published={published} draft={draft} />
          ))}
        </div>
      </main>
    </div>
  );
}
