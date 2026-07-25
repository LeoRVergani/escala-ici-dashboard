import type { Member } from '@/domain/member';
import type { Schedule } from '@/domain/schedule';
import { datesInPeriod } from '@/lib/period';

export interface ScheduleWarning {
  memberId: string;
  message: string;
}

export interface ScheduleValidation {
  errors: string[];
  warnings: ScheduleWarning[];
}

const RESTING_CODES = new Set(['folga', 'ferias', 'afastamento']);

export function validateSchedule(schedule: Schedule, members: Member[]): ScheduleValidation {
  const errors: string[] = [];
  const warnings: ScheduleWarning[] = [];

  if (members.length === 0) {
    errors.push('A escala não possui colaboradores.');
  }
  if (schedule.assignments.length === 0) {
    errors.push('A escala não possui nenhuma atribuição preenchida.');
  }

  const dates = datesInPeriod(schedule.periodStart, schedule.periodEnd);
  for (const member of members) {
    let streak = 0;
    for (const date of dates) {
      const assignment = schedule.assignments.find((a) => a.memberId === member.id && a.date === date);
      const resting = assignment ? RESTING_CODES.has(assignment.shiftCode) : false;
      if (resting) {
        streak = 0;
      } else {
        streak += 1;
        if (streak === 7) {
          warnings.push({ memberId: member.id, message: `${member.name} com 7 dias seguidos sem folga` });
        }
      }
    }
  }

  return { errors, warnings };
}
