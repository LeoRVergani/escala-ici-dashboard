import { describe, expect, it } from 'vitest';
import { validateSchedule } from './validateSchedule';
import { createId } from '@/domain/ids';
import type { Schedule } from '@/domain/schedule';
import type { Member } from '@/domain/member';

const member: Member = { id: 'm1', teamId: 'team-1', name: 'Ana Souza', corporateLogin: 'ana.souza', active: true };

function baseSchedule(): Schedule {
  const now = new Date().toISOString();
  return {
    id: createId(),
    sectorId: 'sector-1',
    teamId: 'team-1',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-10',
    status: 'DRAFT',
    members: [member.id],
    assignments: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe('validateSchedule', () => {
  it('flags an empty schedule as an impeditive error', () => {
    const result = validateSchedule(baseSchedule(), []);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('passes with members and at least one assignment', () => {
    const schedule = baseSchedule();
    schedule.assignments.push({ scheduleId: schedule.id, memberId: member.id, date: '2026-07-01', shiftCode: 'manha' });
    const result = validateSchedule(schedule, [member]);
    expect(result.errors).toHaveLength(0);
  });

  it('warns about 7 consecutive working days without rest', () => {
    const schedule = baseSchedule();
    for (const date of ['01', '02', '03', '04', '05', '06', '07']) {
      schedule.assignments.push({
        scheduleId: schedule.id,
        memberId: member.id,
        date: `2026-07-${date}`,
        shiftCode: 'manha',
      });
    }
    const result = validateSchedule(schedule, [member]);
    expect(result.warnings.some((w) => w.message.includes('7 dias seguidos'))).toBe(true);
    expect(result.warnings.every((w) => w.memberId === member.id)).toBe(true);
  });

  it('does not warn when a folga breaks the streak', () => {
    const schedule = baseSchedule();
    const shifts: Array<[string, Schedule['assignments'][number]['shiftCode']]> = [
      ['01', 'manha'],
      ['02', 'manha'],
      ['03', 'manha'],
      ['04', 'folga'],
      ['05', 'manha'],
      ['06', 'manha'],
      ['07', 'manha'],
    ];
    for (const [day, shiftCode] of shifts) {
      schedule.assignments.push({ scheduleId: schedule.id, memberId: member.id, date: `2026-07-${day}`, shiftCode });
    }
    const result = validateSchedule(schedule, [member]);
    expect(result.warnings.some((w) => w.message.includes('7 dias seguidos'))).toBe(false);
  });
});
