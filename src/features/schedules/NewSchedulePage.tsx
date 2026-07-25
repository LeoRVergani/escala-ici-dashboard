import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams, useSearch } from 'wouter';
import { Header } from '@/app/Header';
import { AppCard } from '@/components/AppCard';
import { AppButton } from '@/components/AppButton';
import { AppTabs } from '@/components/AppTabs';
import { AppAlert } from '@/components/AppAlert';
import { AppBreadcrumb } from '@/components/AppBreadcrumb';
import { Icon } from '@/design-system/icons';
import { useOrganizationRepository, useScheduleRepository } from '@/app/services';
import type { Team } from '@/domain/team';
import type { Sector } from '@/domain/sector';
import type { ScheduleType } from '@/domain/team';
import { SCHEDULE_TYPES, SCHEDULE_TYPE_LABELS } from '@/domain/scheduleTypeLabels';
import { createId } from '@/domain/ids';
import { currentMonthPeriod } from '@/lib/period';

type Mode = 'empty' | 'import';

export function NewSchedulePage() {
  const { teamId } = useParams<{ teamId: string }>();
  const search = useSearch();
  const [, navigate] = useLocation();
  const organizationRepository = useOrganizationRepository();
  const scheduleRepository = useScheduleRepository();

  const initialMode = useMemo<Mode>(
    () => (new URLSearchParams(search).get('mode') === 'empty' ? 'empty' : 'import'),
    [search],
  );
  const [mode, setMode] = useState<Mode>(initialMode);
  const [team, setTeam] = useState<Team | null>(null);
  const [sector, setSector] = useState<Sector | null>(null);
  const [selectedType, setSelectedType] = useState<ScheduleType>('GENERIC');
  const [creating, setCreating] = useState(false);

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void organizationRepository.getTeam(teamId).then((t) => {
      setTeam(t);
      if (t) {
        setSelectedType(t.scheduleType);
        void organizationRepository.getSector(t.sectorId).then(setSector);
      }
    });
  }, [organizationRepository, teamId]);

  const handleCreateEmpty = async () => {
    if (!team) return;
    setCreating(true);
    const { periodStart, periodEnd } = currentMonthPeriod();
    const now = new Date().toISOString();
    const schedule = await scheduleRepository.create({
      id: createId(),
      sectorId: team.sectorId,
      teamId: team.id,
      periodStart,
      periodEnd,
      status: 'DRAFT',
      members: [],
      assignments: [],
      createdAt: now,
      updatedAt: now,
    });
    navigate(`/escalas/${schedule.id}`);
  };

  const handleFileSelected = async (file: File) => {
    if (!team) return;
    setImporting(true);
    setImportError(null);
    setImportWarnings([]);
    try {
      const { readWorkbook, analyzeWorkbook, buildSchedule } = await import('@/lib/parser/parser');
      const { convertParsedScheduleToDraft } = await import('@/features/import/convertParsedSchedule');
      const buffer = await file.arrayBuffer();
      const workbook = readWorkbook(buffer);
      const analysis = analyzeWorkbook(workbook, file.name);
      if (analysis.errors.length > 0 || analysis.options.length === 0) {
        setImportError(
          analysis.errors[0] ?? 'Nenhuma aba com escala reconhecível foi encontrada neste arquivo.',
        );
        return;
      }
      const option = analysis.options[0];
      const result = buildSchedule(workbook, analysis, option.key);
      const sheet = analysis.sheets.find((s) => s.sheetName === option.sheetName);
      if (sheet?.warnings?.length) setImportWarnings(sheet.warnings);

      const schedule = await convertParsedScheduleToDraft(
        result.state,
        { sectorId: team.sectorId, teamId: team.id },
        organizationRepository,
      );
      await scheduleRepository.create(schedule);
      navigate(`/escalas/${schedule.id}`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Falha ao importar o arquivo.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-orbita-bg">
      <Header breadcrumb={sector && team ? { sectorCode: sector.code, teamCode: team.code } : undefined} />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-[20px] font-bold text-white">
          {mode === 'import' ? `Importar escala ${team?.name ?? ''}` : `Criar escala vazia — ${team?.name ?? ''}`}
        </h1>
        {team && <AppBreadcrumb segments={sector ? [sector.code, team.code] : [team.code]} />}

        <div className="mt-6">
          <AppTabs
            aria-label="Modo de criação de escala"
            activeKey={mode}
            onChange={(key) => setMode(key as Mode)}
            tabs={[
              { key: 'empty', label: 'Criar vazia' },
              { key: 'import', label: 'Importar XLS/XLSX' },
            ]}
          />
        </div>

        {mode === 'empty' && (
          <AppCard className="mt-6 p-6">
            <p className="text-[13px] text-orbita-text-muted">Tipo de escala</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {SCHEDULE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  aria-pressed={selectedType === type}
                  className={`focus-ring rounded-[var(--radius-control)] border px-3 py-3 text-left text-[13px] ${
                    selectedType === type
                      ? 'border-orbita-blue bg-orbita-blue/10 text-white'
                      : 'border-orbita-border text-orbita-text-muted hover:border-orbita-blue/40'
                  }`}
                >
                  {SCHEDULE_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            <AppButton
              variant="primary"
              className="mt-6 w-full"
              disabled={creating || !team}
              onClick={() => void handleCreateEmpty()}
            >
              Criar agora
            </AppButton>
          </AppCard>
        )}

        {mode === 'import' && (
          <AppCard className="mt-6 p-6">
            <div
              className="rounded-[var(--radius-card-sm)] border border-dashed border-orbita-border p-10 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) void handleFileSelected(file);
              }}
            >
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-[var(--radius-control)] bg-orbita-elevated text-orbita-text-muted">
                {Icon.upload}
              </div>
              <p className="mt-4 text-[14px] font-semibold text-white">
                Arraste seu arquivo ou clique para selecionar
              </p>
              <p className="mt-1 text-[12px] text-orbita-text-faint">Formatos aceitos .xls e .xlsx • até 5MB</p>
              <AppButton
                variant="secondary"
                className="mt-4"
                disabled={importing}
                onClick={() => fileInputRef.current?.click()}
              >
                {importing ? 'Importando...' : 'Selecionar arquivo'}
              </AppButton>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileSelected(file);
                }}
              />
            </div>
            {importError && (
              <div className="mt-4">
                <AppAlert tone="error">Erro impeditivo: {importError}</AppAlert>
              </div>
            )}
            {importWarnings.length > 0 && (
              <div className="mt-4">
                <AppAlert tone="warning">
                  {importWarnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </AppAlert>
              </div>
            )}
          </AppCard>
        )}
      </main>
    </div>
  );
}
