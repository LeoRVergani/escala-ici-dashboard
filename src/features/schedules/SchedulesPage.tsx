import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import { Header } from '@/app/Header';
import { AppCard } from '@/components/AppCard';
import { AppBadge } from '@/components/AppBadge';
import { AppButton } from '@/components/AppButton';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { AppAlert } from '@/components/AppAlert';
import { useOrganizationRepository, useScheduleRepository } from '@/app/services';
import type { Team } from '@/domain/team';
import type { Sector } from '@/domain/sector';
import type { Schedule } from '@/domain/schedule';
import { formatPeriod, formatDateTime } from '@/lib/format';

export function SchedulesPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const organizationRepository = useOrganizationRepository();
  const scheduleRepository = useScheduleRepository();
  const [team, setTeam] = useState<Team | null | undefined>(undefined);
  const [sector, setSector] = useState<Sector | null>(null);
  const [published, setPublished] = useState<Schedule | null | undefined>(undefined);
  const [draft, setDraft] = useState<Schedule | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void organizationRepository.getTeam(teamId).then(async (t) => {
      if (cancelled) return;
      setTeam(t);
      if (t) setSector(await organizationRepository.getSector(t.sectorId));
    });
    void scheduleRepository.getPublishedByTeam(teamId).then((s) => !cancelled && setPublished(s));
    void scheduleRepository.getDraftByTeam(teamId).then((s) => !cancelled && setDraft(s));
    return () => {
      cancelled = true;
    };
  }, [organizationRepository, scheduleRepository, teamId]);

  if (team === null) {
    return (
      <div className="min-h-screen bg-orbita-bg">
        <Header />
        <main className="mx-auto max-w-4xl px-6 py-10">
          <AppAlert tone="error">Equipe não encontrada.</AppAlert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orbita-bg">
      <Header breadcrumb={sector && team ? { sectorCode: sector.code, teamCode: team.code } : undefined} />
      <main className="mx-auto max-w-4xl px-6 py-10">
        {team && (
          <>
            <AppBreadcrumb segments={sector ? [sector.code, team.code] : [team.code]} />
            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-[20px] font-bold text-white">Escala {team.name}</h1>
              {published && <AppBadge tone="success">Publicado</AppBadge>}
              {!published && draft && <AppBadge tone="warning">Rascunho</AppBadge>}
            </div>
            {(published ?? draft) && (
              <p className="mt-1 text-[13px] text-orbita-text-muted">
                Período atual {formatPeriod((published ?? draft)!.periodStart, (published ?? draft)!.periodEnd)} ·{' '}
                Atualizada {formatDateTime((published ?? draft)!.updatedAt)}
              </p>
            )}
          </>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <AppCard className="p-5">
            <h2 className="text-[15px] font-semibold text-white">Criar escala vazia</h2>
            <p className="mt-1 text-[13px] text-orbita-text-muted">Escolha o tipo de escala e comece do zero.</p>
            <Link href={`/equipes/${teamId}/escalas/nova?mode=empty`} className="mt-4 block">
              <AppButton variant="secondary" className="w-full">
                Criar agora
              </AppButton>
            </Link>
          </AppCard>

          <AppCard className="p-5">
            <h2 className="text-[15px] font-semibold text-white">Importar XLS/XLSX</h2>
            <p className="mt-1 text-[13px] text-orbita-text-muted">Formatos aceitos .xls e .xlsx.</p>
            <Link href={`/equipes/${teamId}/escalas/nova?mode=import`} className="mt-4 block">
              <AppButton variant="secondary" className="w-full">
                Importar arquivo
              </AppButton>
            </Link>
          </AppCard>

          {draft && (
            <AppCard className="p-5">
              <h2 className="text-[15px] font-semibold text-white">Abrir rascunho</h2>
              <p className="mt-1 text-[13px] text-orbita-text-muted">Salvo em {formatDateTime(draft.updatedAt)}.</p>
              <Link href={`/escalas/${draft.id}`} className="mt-4 block">
                <AppButton variant="primary" className="w-full">
                  Continuar rascunho
                </AppButton>
              </Link>
            </AppCard>
          )}

          {published && (
            <AppCard className="p-5">
              <h2 className="text-[15px] font-semibold text-white">Abrir escala publicada</h2>
              <p className="mt-1 text-[13px] text-orbita-text-muted">Consulte a escala vigente sem editar.</p>
              <Link href={`/escalas/${published.id}`} className="mt-4 block">
                <AppButton variant="secondary" className="w-full">
                  Abrir escala atual
                </AppButton>
              </Link>
            </AppCard>
          )}
        </div>
      </main>
    </div>
  );
}
