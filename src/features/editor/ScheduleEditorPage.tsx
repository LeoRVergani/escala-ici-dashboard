import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import { Header } from '@/app/Header';
import { AppCard } from '@/components/AppCard';
import { AppBadge } from '@/components/AppBadge';
import { AppButton } from '@/components/AppButton';
import { AppEmptyState } from '@/components/AppEmptyState';
import { AppConfirm } from '@/components/AppConfirm';
import { AppAlert } from '@/components/AppAlert';
import { AppIcon } from '@/components/AppIcon';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { useToast } from '@/components/AppToast';
import { useOrganizationRepository, useScheduleRepository } from '@/app/services';
import type { Team } from '@/domain/team';
import type { Sector } from '@/domain/sector';
import type { Schedule } from '@/domain/schedule';
import type { Member } from '@/domain/member';
import { formatPeriod, formatDateTime } from '@/lib/format';
import { datesInPeriod } from '@/lib/period';
import { useScheduleEditor } from './useScheduleEditor';
import { ScheduleGrid } from './ScheduleGrid';
import { ScheduleToolbar } from './ScheduleToolbar';
import { AlertsPanel } from './AlertsPanel';
import { validateSchedule } from './validateSchedule';
import type { AlertSeverity } from './validateSchedule';
import { computePrimaryShiftByMember } from './primaryShift';

type Step = 'editing' | 'review' | 'success';

const alertSeverityRank: Record<AlertSeverity, number> = {
  info: 1,
  atencao: 2,
  critico: 3,
};

export function ScheduleEditorPage() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const organizationRepository = useOrganizationRepository();
  const scheduleRepository = useScheduleRepository();

  const [initialSchedule, setInitialSchedule] = useState<Schedule | null | undefined>(undefined);
  const [team, setTeam] = useState<Team | null>(null);
  const [sector, setSector] = useState<Sector | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [step, setStep] = useState<Step>('editing');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [confirmingPublish, setConfirmingPublish] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void scheduleRepository.getById(scheduleId).then(async (s) => {
      if (cancelled) return;
      setInitialSchedule(s);
      if (s) {
        setLastSavedAt(s.updatedAt);
        const t = await organizationRepository.getTeam(s.teamId);
        if (cancelled) return;
        setTeam(t);
        if (t) setSector(await organizationRepository.getSector(t.sectorId));
        const teamMembers = await organizationRepository.listMembersByTeam(s.teamId);
        if (!cancelled) setMembers(teamMembers.filter((m) => s.members.includes(m.id)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [organizationRepository, scheduleRepository, scheduleId]);

  if (initialSchedule === null) {
    return (
      <div className="min-h-screen bg-orbita-bg">
        <Header />
        <main className="mx-auto max-w-4xl px-6 py-10">
          <AppAlert tone="error">Escala não encontrada.</AppAlert>
        </main>
      </div>
    );
  }

  if (initialSchedule === undefined) {
    return (
      <div className="min-h-screen bg-orbita-bg">
        <Header />
      </div>
    );
  }

  return (
    <ScheduleEditorLoaded
      key={initialSchedule.id}
      initialSchedule={initialSchedule}
      team={team}
      sector={sector}
      members={members}
      setMembers={setMembers}
      step={step}
      setStep={setStep}
      lastSavedAt={lastSavedAt}
      setLastSavedAt={setLastSavedAt}
      confirmingPublish={confirmingPublish}
      setConfirmingPublish={setConfirmingPublish}
    />
  );
}

interface LoadedProps {
  initialSchedule: Schedule;
  team: Team | null;
  sector: Sector | null;
  members: Member[];
  setMembers: (m: Member[]) => void;
  step: Step;
  setStep: (s: Step) => void;
  lastSavedAt: string | null;
  setLastSavedAt: (s: string) => void;
  confirmingPublish: boolean;
  setConfirmingPublish: (b: boolean) => void;
}

function ScheduleEditorLoaded({
  initialSchedule,
  team,
  sector,
  members,
  setMembers,
  step,
  setStep,
  lastSavedAt,
  setLastSavedAt,
  confirmingPublish,
  setConfirmingPublish,
}: LoadedProps) {
  const organizationRepository = useOrganizationRepository();
  const scheduleRepository = useScheduleRepository();
  const toast = useToast();
  const editor = useScheduleEditor(initialSchedule);
  const dates = datesInPeriod(editor.schedule.periodStart, editor.schedule.periodEnd);
  const [alertsPanelOpen, setAlertsPanelOpen] = useState(false);

  useEffect(() => {
    if (!editor.dirty) return;
    const timeout = setTimeout(() => {
      void scheduleRepository.save(editor.schedule).then((saved) => {
        setLastSavedAt(saved.updatedAt);
        editor.setDirty(false);
      });
    }, 1000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.dirty, editor.schedule]);

  async function handleSaveNow() {
    const saved = await scheduleRepository.save(editor.schedule);
    setLastSavedAt(saved.updatedAt);
    editor.setDirty(false);
    toast.show('Rascunho salvo.', 'success');
  }

  async function handleAddMember(name: string, corporateLogin: string) {
    if (!team) return;
    const member = await organizationRepository.addMember({ teamId: team.id, name, corporateLogin, active: true });
    setMembers([...members, member]);
    editor.setSchedule((s) => ({ ...s, members: [...s.members, member.id] }));
    toast.show(`${name} adicionado(a) à escala.`, 'success');
  }

  async function handleRemoveMember(memberId: string) {
    const removed = members.find((m) => m.id === memberId);
    await organizationRepository.removeMember(memberId);
    setMembers(members.filter((m) => m.id !== memberId));
    editor.setSchedule((s) => ({ ...s, members: s.members.filter((id) => id !== memberId) }));
    if (removed) toast.show(`${removed.name} removido(a) da escala.`, 'info');
  }

  function handleNavigateToAlert(memberId: string, date?: string) {
    setAlertsPanelOpen(false);
    if (!date) return;
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-member-id="${memberId}"][data-date="${date}"]`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      el.classList.add('alert-highlight');
      setTimeout(() => el.classList.remove('alert-highlight'), 1500);
    });
  }

  const validation = validateSchedule(editor.schedule, members);
  const primaryShiftByMember = computePrimaryShiftByMember(
    members.map((m) => m.id),
    editor.schedule.assignments,
  );
  const selectedWarningByMember = new Map<string, (typeof validation.warnings)[number]>();
  for (const warning of validation.warnings) {
    const selected = selectedWarningByMember.get(warning.memberId);
    if (!selected || alertSeverityRank[warning.severity] > alertSeverityRank[selected.severity]) {
      selectedWarningByMember.set(warning.memberId, warning);
    }
  }
  const warningsByMember = new Map<string, string>(
    Array.from(selectedWarningByMember, ([memberId, warning]) => [memberId, warning.message]),
  );
  const actionableAlertCount = validation.warnings.filter((w) => w.severity !== 'info').length;

  if (!team) {
    return (
      <div className="min-h-screen bg-orbita-bg">
        <Header />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orbita-bg">
      <Header breadcrumb={sector ? { sectorCode: sector.code, teamCode: team.code } : undefined} />
      <main className="mx-auto max-w-[1900px] px-4 py-8 sm:px-6 lg:px-10">
        {step === 'editing' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <AppBreadcrumb
                  segments={[sector?.code ?? '', team.code, formatPeriod(editor.schedule.periodStart, editor.schedule.periodEnd)].filter(
                    Boolean,
                  )}
                />
                <div className="mt-1 flex items-center gap-2">
                  {editor.schedule.status === 'PUBLISHED' ? (
                    <AppBadge tone="success">Publicado</AppBadge>
                  ) : (
                    <AppBadge tone="warning">Rascunho</AppBadge>
                  )}
                  <span className="text-[12px] text-orbita-text-faint">
                    {editor.dirty ? 'Salvando...' : lastSavedAt ? `Salvo automaticamente ${formatDateTime(lastSavedAt)}` : ''}
                  </span>
                </div>
              </div>
              <AppButton variant="success" onClick={() => setStep('review')}>
                Continuar para publicação
              </AppButton>
            </div>

            <ScheduleToolbar
              canUndo={editor.canUndo}
              canRedo={editor.canRedo}
              onUndo={editor.undo}
              onRedo={editor.redo}
              onSave={() => void handleSaveNow()}
              alertCount={actionableAlertCount}
              onOpenAlerts={() => setAlertsPanelOpen(true)}
              members={members}
              onAddMember={(name, login) => void handleAddMember(name, login)}
              onRemoveMember={(id) => void handleRemoveMember(id)}
              onCopyDay={() => editor.copyDay(dates[0], members.map((m) => m.id))}
              onPasteDay={() => editor.pasteDay(dates[0], members.map((m) => m.id))}
              onCopyWeek={() => editor.copyWeek(dates[0], members.map((m) => m.id))}
              onPasteWeek={() => editor.pasteWeek(dates[0], members.map((m) => m.id))}
              hasClipboard={editor.hasClipboard}
            />

            <AlertsPanel
              open={alertsPanelOpen}
              onClose={() => setAlertsPanelOpen(false)}
              errors={validation.errors}
              warnings={validation.warnings}
              members={members}
              onNavigateToAlert={handleNavigateToAlert}
            />

            <div className="mt-4">
              {members.length === 0 ? (
                <AppEmptyState
                  title="Nenhum colaborador nesta escala ainda."
                  description='Use "Mais ações → Adicionar colaborador" para começar.'
                />
              ) : (
                <ScheduleGrid
                  members={members}
                  dates={dates}
                  scheduleType={team.scheduleType}
                  cellValue={editor.cellValue}
                  onApply={editor.setCells}
                  onClear={editor.clearCells}
                  onMove={editor.moveCell}
                  warningsByMember={warningsByMember}
                  primaryShiftByMember={primaryShiftByMember}
                />
              )}
            </div>
          </>
        )}

        {step === 'review' && (
          <div className="mx-auto max-w-3xl">
            <h1 className="text-[20px] font-bold text-white">Conferir alterações</h1>
            <p className="mt-1 text-[13px] text-orbita-text-muted">
              Revise antes de publicar. A escala anterior permanecerá no histórico.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <AppCard className="p-5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-orbita-text-faint">
                  Resumo da publicação
                </p>
                <dl className="mt-3 space-y-2 text-[13px]">
                  <Row label="Área" value={sector?.code ?? '—'} />
                  <Row label="Equipe" value={team.name} />
                  <Row label="Período" value={formatPeriod(editor.schedule.periodStart, editor.schedule.periodEnd)} />
                  <Row label="Colaboradores" value={String(members.length)} />
                  <Row label="Dias da escala" value={String(dates.length)} />
                  <Row label="Atribuições" value={String(editor.schedule.assignments.length)} />
                </dl>
              </AppCard>
              <AppCard className="p-5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-orbita-text-faint">Validação</p>
                {validation.errors.length === 0 ? (
                  <div className="mt-3">
                    <AppAlert tone="success">Nenhum erro impeditivo</AppAlert>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    {validation.errors.map((e) => (
                      <AppAlert key={e} tone="error">
                        {e}
                      </AppAlert>
                    ))}
                  </div>
                )}
                {validation.warnings.length > 0 && (
                  <div className="mt-3">
                    <AppAlert tone="warning">
                      <p>{validation.warnings.length} avisos para conferir</p>
                      <ul className="mt-1 list-disc pl-4">
                        {validation.warnings.map((w) => (
                          <li key={`${w.memberId}-${w.message}`}>{w.message}</li>
                        ))}
                      </ul>
                    </AppAlert>
                  </div>
                )}
                <div className="mt-5 flex gap-2">
                  <AppButton variant="secondary" className="flex-1" onClick={() => setStep('editing')}>
                    Voltar para a escala
                  </AppButton>
                  <AppButton
                    variant="success"
                    className="flex-1"
                    disabled={validation.errors.length > 0}
                    onClick={() => setConfirmingPublish(true)}
                  >
                    Publicar escala
                  </AppButton>
                </div>
              </AppCard>
            </div>

            <AppConfirm
              open={confirmingPublish}
              title="Publicar escala?"
              message="Publicação local de desenvolvimento. A integração remota será adicionada após a aprovação deste frontend."
              confirmVariant="success"
              onCancel={() => setConfirmingPublish(false)}
              onConfirm={async () => {
                await scheduleRepository.save(editor.schedule);
                const published = await scheduleRepository.publish(editor.schedule.id);
                editor.setSchedule(published);
                setConfirmingPublish(false);
                setStep('success');
                toast.show('Escala publicada localmente.', 'success');
              }}
            />
          </div>
        )}

        {step === 'success' && (
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-[var(--radius-pill)] bg-orbita-success/10">
              <AppIcon name="checkCircle" size={24} tone="success" decorative />
            </div>
            <h1 className="mt-4 text-[20px] font-bold text-white">Escala {team.name} publicada</h1>
            <p className="mt-2 text-[13px] text-orbita-text-muted">
              {formatPeriod(editor.schedule.periodStart, editor.schedule.periodEnd)} · {formatDateTime(editor.schedule.updatedAt)} ·{' '}
              {members.length} {members.length === 1 ? 'colaborador' : 'colaboradores'}
            </p>
            <div className="mt-4">
              <AppAlert tone="info">
                Publicação local de desenvolvimento. A integração remota será adicionada após a aprovação deste
                frontend.
              </AppAlert>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <AppButton variant="secondary" onClick={() => setStep('editing')}>
                Abrir escala publicada
              </AppButton>
              <Link href={`/equipes/${team.id}/escalas`}>
                <AppButton variant="primary" className="w-full">
                  Voltar para minhas equipes
                </AppButton>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-orbita-text-muted">{label}</dt>
      <dd className="font-medium text-white">{value}</dd>
    </div>
  );
}
