import { describe, expect, it, beforeEach } from 'vitest';
import { convertParsedScheduleToDraft } from './convertParsedSchedule';
import { LocalOrganizationRepository } from '@/services/LocalOrganizationRepository';
import { SEED_SECTOR_COSI_ID, SEED_TEAM_SOC_ID } from '@/domain/seedIds';
import type { ScheduleState } from '@/lib/parser/types';

function buildParsedState(): ScheduleState {
  return {
    monthKey: { year: 2026, month: 7 },
    technicians: [
      { id: 't1', login: 'ana.souza', name: 'Ana Souza' },
      { id: 't2', login: 'bruno.lima', name: 'Bruno Lima' },
    ],
    // column indices are 1-based, per the parser's ScheduleState contract
    cells: {
      t1: {
        1: { shift: 'manha' },
        2: { shift: 'folga' },
      },
      t2: {
        1: { shift: 'custom', text: 'Cobertura extra' },
      },
    },
    dates: ['2026-07-01', '2026-07-02', '2026-07-03'],
  };
}

describe('convertParsedScheduleToDraft (scenarios: colaboradores/atribuições extraídas)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists every parsed technician as a real Member of the target team', async () => {
    const organizationRepository = new LocalOrganizationRepository();
    const schedule = await convertParsedScheduleToDraft(
      buildParsedState(),
      { sectorId: SEED_SECTOR_COSI_ID, teamId: SEED_TEAM_SOC_ID },
      organizationRepository,
    );

    expect(schedule.members).toHaveLength(2);
    const members = await organizationRepository.listMembersByTeam(SEED_TEAM_SOC_ID);
    expect(members.map((m) => m.name).sort()).toEqual(['Ana Souza', 'Bruno Lima']);
    expect(members.every((m) => m.corporateLogin)).toBe(true);
  });

  it('maps 1-based parser columns to the correct calendar dates', async () => {
    const organizationRepository = new LocalOrganizationRepository();
    const schedule = await convertParsedScheduleToDraft(
      buildParsedState(),
      { sectorId: SEED_SECTOR_COSI_ID, teamId: SEED_TEAM_SOC_ID },
      organizationRepository,
    );

    const members = await organizationRepository.listMembersByTeam(SEED_TEAM_SOC_ID);
    const ana = members.find((m) => m.name === 'Ana Souza')!;
    const bruno = members.find((m) => m.name === 'Bruno Lima')!;

    expect(schedule.assignments).toContainEqual(
      expect.objectContaining({ memberId: ana.id, date: '2026-07-01', shiftCode: 'manha' }),
    );
    expect(schedule.assignments).toContainEqual(
      expect.objectContaining({ memberId: ana.id, date: '2026-07-02', shiftCode: 'folga' }),
    );
    expect(schedule.assignments).toContainEqual(
      expect.objectContaining({ memberId: bruno.id, date: '2026-07-01', shiftCode: 'custom', note: 'Cobertura extra' }),
    );
    // column 1 must map to the FIRST date, not the second (off-by-one regression guard)
    expect(schedule.assignments.some((a) => a.memberId === ana.id && a.date === '2026-07-02' && a.shiftCode === 'manha')).toBe(
      false,
    );
  });

  it('builds a DRAFT schedule tied to the given sector and team', async () => {
    const organizationRepository = new LocalOrganizationRepository();
    const schedule = await convertParsedScheduleToDraft(
      buildParsedState(),
      { sectorId: SEED_SECTOR_COSI_ID, teamId: SEED_TEAM_SOC_ID },
      organizationRepository,
    );
    expect(schedule.status).toBe('DRAFT');
    expect(schedule.sectorId).toBe(SEED_SECTOR_COSI_ID);
    expect(schedule.teamId).toBe(SEED_TEAM_SOC_ID);
  });
});
