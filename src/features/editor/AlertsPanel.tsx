import type { ReactNode } from 'react';
import { AppAlert } from '@/components/AppAlert';
import { AppBadge, type AppBadgeTone } from '@/components/AppBadge';
import { AppDrawer } from '@/components/AppDrawer';
import type { Member } from '@/domain/member';
import type { AlertRuleCode, AlertSeverity, ScheduleWarning } from './validateSchedule';

interface AlertsPanelProps {
  open: boolean;
  onClose: () => void;
  errors: string[];
  warnings: ScheduleWarning[];
  members: Member[];
  onNavigateToAlert: (memberId: string, date?: string) => void;
}

const RULE_LABELS: Record<AlertRuleCode, string> = {
  duplicateMember: 'Colaborador duplicado',
  singleVacationDay: 'Férias isoladas',
  sixByOne: 'Regra 6x1',
  restHours: 'Descanso mínimo',
  onCallGap: 'Cobertura de plantão',
};

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  critico: 'Crítico',
  atencao: 'Atenção',
  info: 'Info',
};

const SEVERITY_TONES: Record<AlertSeverity, AppBadgeTone> = {
  critico: 'warning',
  atencao: 'attention',
  info: 'info',
};

function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

export function AlertsPanel({ open, onClose, errors, warnings, members, onNavigateToAlert }: AlertsPanelProps) {
  const actionableWarnings = warnings.filter((warning) => warning.severity === 'critico' || warning.severity === 'atencao');
  const infoWarnings = warnings.filter((warning) => warning.severity === 'info');
  const isEmpty = errors.length === 0 && warnings.length === 0;

  return (
    <AppDrawer open={open} onClose={onClose} title="Alertas da escala" side="right">
      <div className="max-h-[70vh] space-y-4 overflow-auto pr-1">
        {isEmpty && <p className="text-[12px] text-orbita-text-faint">Nenhum alerta.</p>}

        {errors.length > 0 && (
          <section aria-labelledby="alerts-panel-errors-title" className="space-y-2">
            <h3 id="alerts-panel-errors-title" className="text-[12px] font-semibold uppercase tracking-wide text-orbita-text-faint">
              Erros impeditivos
            </h3>
            <div className="space-y-2">
              {errors.map((error) => (
                <AppAlert key={error} tone="error">
                  {error}
                </AppAlert>
              ))}
            </div>
          </section>
        )}

        {actionableWarnings.length > 0 && (
          <AlertSection title="Alertas" titleId="alerts-panel-warnings-title">
            {actionableWarnings.map((warning) => (
              <WarningItem
                key={warning.dedupKey}
                warning={warning}
                memberName={members.find((member) => member.id === warning.memberId)?.name ?? '—'}
                onNavigateToAlert={onNavigateToAlert}
              />
            ))}
          </AlertSection>
        )}

        {infoWarnings.length > 0 && (
          <AlertSection title="Informações" titleId="alerts-panel-info-title">
            {infoWarnings.map((warning) => (
              <WarningItem
                key={warning.dedupKey}
                warning={warning}
                memberName={members.find((member) => member.id === warning.memberId)?.name ?? '—'}
                onNavigateToAlert={onNavigateToAlert}
              />
            ))}
          </AlertSection>
        )}
      </div>
    </AppDrawer>
  );
}

function AlertSection({ title, titleId, children }: { title: string; titleId: string; children: ReactNode }) {
  return (
    <section aria-labelledby={titleId} className="space-y-2">
      <h3 id={titleId} className="text-[12px] font-semibold uppercase tracking-wide text-orbita-text-faint">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function WarningItem({
  warning,
  memberName,
  onNavigateToAlert,
}: {
  warning: ScheduleWarning;
  memberName: string;
  onNavigateToAlert: (memberId: string, date?: string) => void;
}) {
  const canNavigate = Boolean(warning.memberId && warning.date);

  return (
    <article className="rounded-[var(--radius-control)] border border-orbita-border bg-orbita-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13px] font-semibold text-white">{RULE_LABELS[warning.ruleCode]}</p>
          <div className="mt-1">
            <AppBadge tone={SEVERITY_TONES[warning.severity]}>{SEVERITY_LABELS[warning.severity]}</AppBadge>
          </div>
        </div>
        {canNavigate && (
          <button
            type="button"
            onClick={() => onNavigateToAlert(warning.memberId, warning.date)}
            className="focus-ring rounded-[var(--radius-control)] px-2 py-1 text-[12px] font-medium text-orbita-blue hover:bg-orbita-elevated hover:text-white"
          >
            Ir para
          </button>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        <div>
          <dt className="text-orbita-text-faint">Colaborador</dt>
          <dd className="mt-0.5 text-orbita-text-muted">{memberName}</dd>
        </div>
        <div>
          <dt className="text-orbita-text-faint">Data</dt>
          <dd className="mt-0.5 text-orbita-text-muted">{warning.date ? formatDate(warning.date) : '—'}</dd>
        </div>
      </dl>

      <p className="mt-3 text-[12px] leading-5 text-orbita-text-muted">{warning.message}</p>
    </article>
  );
}
