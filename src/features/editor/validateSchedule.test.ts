import { describe, expect, it } from 'vitest';
import { validateSchedule } from './validateSchedule';
import { createId } from '@/domain/ids';
import { datesInPeriod } from '@/lib/period';
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

  // The next three cases port scenarios from the old project's conflicts.ts —
  // see docs on parser parity (checkpoint 1C, PARTE 2).

  it('warns when rest between two shifts is under 11h (noite ending 01h, manhã starting 07h)', () => {
    const schedule = baseSchedule();
    schedule.assignments.push(
      { scheduleId: schedule.id, memberId: member.id, date: '2026-07-01', shiftCode: 'noite' },
      { scheduleId: schedule.id, memberId: member.id, date: '2026-07-02', shiftCode: 'manha' },
    );
    const result = validateSchedule(schedule, [member]);
    expect(result.warnings.some((w) => w.message.includes('descanso') && w.message.includes('mínimo esperado: 11h'))).toBe(
      true,
    );
  });

  it('does not warn about rest when the gap between shifts is at least 11h', () => {
    const schedule = baseSchedule();
    schedule.assignments.push(
      { scheduleId: schedule.id, memberId: member.id, date: '2026-07-01', shiftCode: 'manha' },
      { scheduleId: schedule.id, memberId: member.id, date: '2026-07-02', shiftCode: 'manha' },
    );
    const result = validateSchedule(schedule, [member]);
    expect(result.warnings.some((w) => w.message.includes('descanso'))).toBe(false);
  });

  it('warns about a single vacation day sandwiched between two workdays', () => {
    const schedule = baseSchedule();
    schedule.assignments.push(
      { scheduleId: schedule.id, memberId: member.id, date: '2026-07-01', shiftCode: 'manha' },
      { scheduleId: schedule.id, memberId: member.id, date: '2026-07-02', shiftCode: 'ferias' },
      { scheduleId: schedule.id, memberId: member.id, date: '2026-07-03', shiftCode: 'manha' },
    );
    const result = validateSchedule(schedule, [member]);
    expect(result.warnings.some((w) => w.message.includes('único dia de férias'))).toBe(true);
  });

  it('does not warn about a vacation stretch of more than one day', () => {
    const schedule = baseSchedule();
    schedule.assignments.push(
      { scheduleId: schedule.id, memberId: member.id, date: '2026-07-01', shiftCode: 'manha' },
      { scheduleId: schedule.id, memberId: member.id, date: '2026-07-02', shiftCode: 'ferias' },
      { scheduleId: schedule.id, memberId: member.id, date: '2026-07-03', shiftCode: 'ferias' },
      { scheduleId: schedule.id, memberId: member.id, date: '2026-07-04', shiftCode: 'manha' },
    );
    const result = validateSchedule(schedule, [member]);
    expect(result.warnings.some((w) => w.message.includes('único dia de férias'))).toBe(false);
  });

  it('warns when two Members share the same corporate login (leftover from a re-import)', () => {
    const duplicate: Member = { id: 'm2', teamId: 'team-1', name: 'Ana Souza Lima', corporateLogin: 'ana.souza', active: true };
    const schedule = baseSchedule();
    schedule.assignments.push({ scheduleId: schedule.id, memberId: member.id, date: '2026-07-01', shiftCode: 'manha' });
    const result = validateSchedule(schedule, [member, duplicate]);
    expect(result.warnings.some((w) => w.message.includes('aparece mais de uma vez'))).toBe(true);
  });

  it('warns when two Members share the same folded display name, even with a different login', () => {
    const duplicate: Member = { id: 'm2', teamId: 'team-1', name: 'ana souza', corporateLogin: 'a.souza2', active: true };
    const schedule = baseSchedule();
    schedule.assignments.push({ scheduleId: schedule.id, memberId: member.id, date: '2026-07-01', shiftCode: 'manha' });
    const result = validateSchedule(schedule, [member, duplicate]);
    expect(result.warnings.some((w) => w.message.includes('aparece mais de uma vez'))).toBe(true);
  });

  it('does not warn about duplicates when every member has a distinct login and name', () => {
    const other: Member = { id: 'm2', teamId: 'team-1', name: 'Bruno Lima', corporateLogin: 'bruno.lima', active: true };
    const schedule = baseSchedule();
    const result = validateSchedule(schedule, [member, other]);
    expect(result.warnings.some((w) => w.message.includes('aparece mais de uma vez'))).toBe(false);
  });

  it('warns about an on-call coverage gap — a period date with no plantao assignment', () => {
    const schedule = baseSchedule(); // 2026-07-01..10
    schedule.assignments.push(
      { scheduleId: schedule.id, memberId: member.id, date: '2026-07-01', shiftCode: 'plantao' },
      // 07-02 through 07-09 intentionally left uncovered
      { scheduleId: schedule.id, memberId: member.id, date: '2026-07-10', shiftCode: 'plantao' },
    );
    const result = validateSchedule(schedule, [member]);
    expect(result.warnings.some((w) => w.message.includes('Sem plantonista coberto em 02/07/2026'))).toBe(true);
  });

  it('does not warn about coverage when every period date has a plantao assignment', () => {
    const schedule = baseSchedule(); // 2026-07-01..10
    for (const date of datesInPeriod(schedule.periodStart, schedule.periodEnd)) {
      schedule.assignments.push({ scheduleId: schedule.id, memberId: member.id, date, shiftCode: 'plantao' });
    }
    const result = validateSchedule(schedule, [member]);
    expect(result.warnings.some((w) => w.message.includes('Sem plantonista coberto'))).toBe(false);
  });

  it('never checks on-call coverage for a schedule that has no plantao assignments at all (SOC/N1)', () => {
    const schedule = baseSchedule();
    // Only manha/folga — a normal SOC/N1 schedule never uses 'plantao'; most days here
    // have no assignment at all, which must NOT be mistaken for a coverage gap.
    schedule.assignments.push({ scheduleId: schedule.id, memberId: member.id, date: '2026-07-01', shiftCode: 'manha' });
    const result = validateSchedule(schedule, [member]);
    expect(result.warnings.some((w) => w.message.includes('Sem plantonista coberto'))).toBe(false);
  });
});
