import { useEffect, useState } from 'react';
import { OrbitAppShell } from '@/app/shell/OrbitAppShell';
import { AppPageHeader } from '@/components/AppPageHeader';
import { AppButton } from '@/components/AppButton';
import { AppLoadingState } from '@/components/AppLoadingState';
import { AppEmptyState } from '@/components/AppEmptyState';
import { useAuth } from '@/app/auth';
import { useOrganizationRepository, useScheduleRepository } from '@/app/services';
import type { Organization } from '@/domain/organization';
import type { MembershipRole } from '@/domain/membership';
import { formatDateTime } from '@/lib/format';
import { OrganizationCountBadge } from './components/OrganizationCountBadge';
import { OrganizationSummaryCard } from './components/OrganizationSummaryCard';
import { OrganizationList } from './components/OrganizationList';
import { OrganizationListItem } from './components/OrganizationListItem';
import { OrganizationCreateDialog } from './components/OrganizationCreateDialog';

interface OrganizationRow {
  organization: Organization;
  roleLabel: string;
  sectorsTotal: number;
  authorizedSectorsCount: number;
  authorizedTeamsCount: number;
  draftsCount: number;
  lastActivityLabel: string;
}

const ROLE_LABELS: Record<MembershipRole, string> = {
  ADMIN: 'Administrador',
  SCHEDULE_MANAGER: 'Gestor de escalas',
  VIEWER: 'Visualizador',
};

export function OrganizationsPage() {
  const { user } = useAuth();
  const organizationRepository = useOrganizationRepository();
  const scheduleRepository = useScheduleRepository();
  const [rows, setRows] = useState<OrganizationRow[] | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const load = () => {
    if (!user) return;
    void (async () => {
      const organizations = await organizationRepository.listOrganizationsForUser(user.id);
      const allSectors = await organizationRepository.listSectors();

      const nextRows = await Promise.all(
        organizations.map(async (organization): Promise<OrganizationRow> => {
          const [membership, authorization] = await Promise.all([
            organizationRepository.getMembership(user.id, organization.id),
            organizationRepository.getAuthorization(user.id, organization.id),
          ]);
          const orgSectors = allSectors.filter((sector) => sector.organizationId === organization.id);
          const authorizedSectorIds = authorization?.sectorIds ?? [];
          const authorizedTeamIds = authorization?.teamIds ?? [];

          const drafts = await Promise.all(authorizedTeamIds.map((teamId) => scheduleRepository.getDraftByTeam(teamId)));
          const draftsCount = drafts.filter(Boolean).length;

          const teamsBySector = await Promise.all(
            orgSectors.map((sector) => organizationRepository.listTeamsBySector(sector.id)),
          );
          const activityTimestamps = (
            await Promise.all(
              teamsBySector.flat().map(async (team) => {
                const [published, draft] = await Promise.all([
                  scheduleRepository.getPublishedByTeam(team.id),
                  scheduleRepository.getDraftByTeam(team.id),
                ]);
                return [published?.updatedAt, draft?.updatedAt].filter((value): value is string => Boolean(value));
              }),
            )
          ).flat();

          return {
            organization,
            roleLabel: membership ? ROLE_LABELS[membership.role] : 'Sem função definida',
            sectorsTotal: orgSectors.length,
            authorizedSectorsCount: authorizedSectorIds.length,
            authorizedTeamsCount: authorizedTeamIds.length,
            draftsCount,
            lastActivityLabel: activityTimestamps.length
              ? formatDateTime(activityTimestamps.sort().at(-1)!)
              : 'Sem atividade recente',
          };
        }),
      );
      setRows(nextRows);
    })();
  };

  useEffect(load, [user, organizationRepository, scheduleRepository]);

  return (
    <OrbitAppShell activeNavKey="organizacoes" contextLabel="Todas as organizações autorizadas">
      <div className="w-full max-w-[var(--width-main-content)] px-4 py-10 sm:px-6 lg:px-10">
        <AppPageHeader
          eyebrow="Minhas organizações"
          eyebrowTone="accent"
          size="lg"
          title={`Olá, ${user?.name ?? ''}`}
          subtitle="Escolha a organização que deseja acessar."
          metadata={rows && <OrganizationCountBadge count={rows.length} />}
          action={
            <AppButton variant="primary" onClick={() => setCreateDialogOpen(true)}>
              Criar organização
            </AppButton>
          }
        />

        {rows === null && <AppLoadingState />}
        {rows?.length === 0 && (
          <div className="mt-6">
            <AppEmptyState
              title="Nenhuma organização disponível ainda."
              description="Crie uma organização para começar a gerenciar setores e equipes."
            />
          </div>
        )}

        {rows && rows.length > 0 && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[var(--width-summary-column)_minmax(0,1fr)]">
            <OrganizationSummaryCard
              organization={rows[0].organization}
              index={0}
              sectorsTotal={rows[0].sectorsTotal}
              authorizedTeamsCount={rows[0].authorizedTeamsCount}
              draftsCount={rows[0].draftsCount}
            />

            <OrganizationList>
              {rows.map((row) => (
                <OrganizationListItem
                  key={row.organization.id}
                  organization={row.organization}
                  roleLabel={row.roleLabel}
                  authorizedSectorsCount={row.authorizedSectorsCount}
                  lastActivityLabel={row.lastActivityLabel}
                />
              ))}
            </OrganizationList>
          </div>
        )}
      </div>

      <OrganizationCreateDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onCreated={load} />
    </OrbitAppShell>
  );
}
