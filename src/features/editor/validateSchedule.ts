import type { Member } from '@/domain/member';
import type { Schedule, Assignment } from '@/domain/schedule';
import { datesInPeriod } from '@/lib/period';
import { workInterval } from '@/lib/parser/dates';
import { fold } from '@/lib/parser/normalize';

export interface ScheduleWarning {
  memberId: string;
  message: string;
}

export interface ScheduleValidation {
  errors: string[];
  warnings: ScheduleWarning[];
}

const RESTING_CODES = new Set(['folga', 'ferias', 'afastamento']);

/** Canonical "is this a working shift" check, ported from the old project's assignments.ts. */
function isWorkAssignment(assignment: Assignment | undefined): boolean {
  return Boolean(assignment && !RESTING_CODES.has(assignment.shiftCode));
}

function formatBrDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function formatHours(hours: number): string {
  return Math.max(0, hours).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

export function validateSchedule(schedule: Schedule, members: Member[]): ScheduleValidation {
  const errors: string[] = [];
  const warnings: ScheduleWarning[] = [];

  if (members.length === 0) {
    errors.push('A escala não possui colaboradores.');
  }
  if (schedule.assignments.length === 0) {
    errors.push('A escala não possui nenhuma atribuição preenchida.');
  }

  // Duplicate collaborator: same corporate login or same (accent/case-folded)
  // display name on more than one Member record — typically a leftover from
  // re-importing the same spreadsheet (LocalOrganizationRepository.addMember
  // never dedupes). Ported from the old project's conflicts.ts.
  const seenIdentity = new Map<string, string>();
  for (const member of members) {
    for (const key of [member.corporateLogin?.toLowerCase(), fold(member.name)]) {
      if (!key) continue;
      const previous = seenIdentity.get(key);
      if (previous && previous !== member.id) {
        warnings.push({
          memberId: member.id,
          message: `"${member.name}" aparece mais de uma vez na lista de colaboradores.`,
        });
        break;
      }
      seenIdentity.set(key, member.id);
    }
  }

  const dates = datesInPeriod(schedule.periodStart, schedule.periodEnd);
  for (const member of members) {
    const assignmentByDate = new Map(
      schedule.assignments.filter((a) => a.memberId === member.id).map((a) => [a.date, a]),
    );

    let streak = 0;
    const intervals: Array<{ date: string; start: Date; end: Date; label: string }> = [];

    for (let index = 0; index < dates.length; index++) {
      const date = dates[index];
      const current = assignmentByDate.get(date);
      const before = assignmentByDate.get(dates[index - 1]);
      const next = assignmentByDate.get(dates[index + 1]);

      // Single vacation day sandwiched between two workdays.
      if (current?.shiftCode === 'ferias' && isWorkAssignment(before) && isWorkAssignment(next)) {
        warnings.push({
          memberId: member.id,
          message: `${member.name}: um único dia de férias entre dias trabalhados em ${formatBrDate(date)}.`,
        });
      }

      const resting = current ? RESTING_CODES.has(current.shiftCode) : false;
      if (resting) {
        streak = 0;
      } else {
        streak += 1;
        if (streak === 7) {
          warnings.push({ memberId: member.id, message: `${member.name} com 7 dias seguidos sem folga` });
        }
      }

      if (isWorkAssignment(current)) {
        const interval = workInterval(date, { shift: current!.shiftCode, text: current!.note });
        if (interval) intervals.push({ date, ...interval, label: current!.note ?? current!.shiftCode });
      }
    }

    // Rest period between work shifts must be >= 11h — compares chronologically
    // adjacent work intervals (not necessarily adjacent calendar days), same as
    // the old project's conflicts.ts.
    intervals.sort((a, b) => a.start.getTime() - b.start.getTime());
    for (let index = 1; index < intervals.length; index++) {
      const previous = intervals[index - 1];
      const current = intervals[index];
      const restHours = (current.start.getTime() - previous.end.getTime()) / 3_600_000;
      if (restHours >= 11) continue;
      warnings.push({
        memberId: member.id,
        message: `${member.name}: descanso de ${formatHours(restHours)}h entre ${formatBrDate(previous.date)} (${previous.label}) e ${formatBrDate(current.date)} (${current.label}); mínimo esperado: 11h.`,
      });
    }
  }

  // On-call coverage gap: any period date with zero 'plantao' assignments.
  // Ported from the old project's onCall.ts (missingStartDates), scoped down
  // to "missing" only — only checked when the schedule already has at least
  // one plantao assignment, so SOC/N1 schedules (which never use 'plantao')
  // never trigger a false positive here. "Duplicate" coverage was left out:
  // its semantics for this domain model (is overlapping on-call ever valid?)
  // aren't settled, and guessing a rule would be worse than not having one.
  const hasOnCallAssignments = schedule.assignments.some((a) => a.shiftCode === 'plantao');
  if (hasOnCallAssignments) {
    const coveredDates = new Set(
      schedule.assignments.filter((a) => a.shiftCode === 'plantao').map((a) => a.date),
    );
    for (const date of dates) {
      if (!coveredDates.has(date)) {
        warnings.push({ memberId: '', message: `Sem plantonista coberto em ${formatBrDate(date)}.` });
      }
    }
  }

  return { errors, warnings };
}
