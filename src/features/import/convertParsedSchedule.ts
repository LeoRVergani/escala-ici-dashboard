import type { ScheduleState } from '@/lib/parser/types';
import type { Schedule } from '@/domain/schedule';
import type { Member } from '@/domain/member';
import { createId } from '@/domain/ids';
import type { OrganizationRepository } from '@/services/OrganizationRepository';
import { currentMonthPeriod, datesInPeriod } from '@/lib/period';
import { fold } from '@/lib/parser/normalize';

interface ConvertContext {
  sectorId: string;
  teamId: string;
}

/**
 * Persists technicians found by the parser as real Members of the target team,
 * then builds a DRAFT Schedule whose assignments reference those Member ids.
 * The parser's own dates (when the sheet layout carries explicit per-column dates)
 * take priority over the calendar-month fallback.
 */
export async function convertParsedScheduleToDraft(
  state: ScheduleState,
  context: ConvertContext,
  organizationRepository: OrganizationRepository,
): Promise<Schedule> {
  const memberIdByTechId = new Map<string, string>();
  const persistedMembers: Member[] = [];

  for (const technician of state.technicians) {
    const member = await organizationRepository.addMember({
      teamId: context.teamId,
      name: technician.name ?? technician.login ?? technician.id,
      corporateLogin: technician.login ?? technician.id,
      active: true,
    });
    memberIdByTechId.set(technician.id, member.id);
    persistedMembers.push(member);
  }

  const fallbackPeriod = state.monthKey
    ? {
        periodStart: `${state.monthKey.year}-${String(state.monthKey.month).padStart(2, '0')}-01`,
        periodEnd: lastDayOfMonth(state.monthKey.year, state.monthKey.month),
      }
    : currentMonthPeriod();

  const columnDates =
    state.dates && state.dates.length > 0
      ? state.dates
      : datesInPeriod(fallbackPeriod.periodStart, fallbackPeriod.periodEnd);

  const periodStart = columnDates[0] ?? fallbackPeriod.periodStart;
  const periodEnd = columnDates[columnDates.length - 1] ?? fallbackPeriod.periodEnd;

  const now = new Date().toISOString();
  const schedule: Schedule = {
    id: createId(),
    sectorId: context.sectorId,
    teamId: context.teamId,
    periodStart,
    periodEnd,
    status: 'DRAFT',
    members: persistedMembers.map((m) => m.id),
    assignments: [],
    createdAt: now,
    updatedAt: now,
  };

  for (const [techId, dayCells] of Object.entries(state.cells)) {
    const memberId = memberIdByTechId.get(techId);
    if (!memberId) continue;
    for (const [columnIndexStr, cell] of Object.entries(dayCells)) {
      if (!cell) continue;
      // Parser column indices are 1-based ("cells[technicianId][índice da coluna, começando em 1]").
      const columnIndex = Number(columnIndexStr);
      const date = columnDates[columnIndex - 1];
      if (!date) continue;
      schedule.assignments.push({
        scheduleId: schedule.id,
        memberId,
        date,
        shiftCode: cell.shift,
        note: cell.text,
      });
    }
  }

  // On-call imports (Relatório Plantão COSI) never populate state.cells — every
  // record lives in state.onCallRecords instead, matched to a technician by
  // name (buildOnCall never links them by id; see src/lib/parser/parser.ts).
  // Without this, an on-call import silently produced Members with zero
  // Assignments — the schedule data was parsed correctly but discarded here.
  for (const record of state.onCallRecords ?? []) {
    const technician = state.technicians.find((t) => fold(t.name ?? '') === fold(record.technician));
    const memberId = technician && memberIdByTechId.get(technician.id);
    if (!memberId) continue;
    schedule.assignments.push({
      scheduleId: schedule.id,
      memberId,
      date: record.start.slice(0, 10),
      shiftCode: 'plantao',
      note: `${record.start.slice(11, 16)}–${record.end.slice(11, 16)}`,
    });
  }

  return schedule;
}

function lastDayOfMonth(year: number, month: number): string {
  const date = new Date(year, month, 0);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
