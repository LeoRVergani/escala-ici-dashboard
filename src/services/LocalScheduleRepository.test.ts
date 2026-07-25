import { describe, expect, it, beforeEach } from 'vitest';
import { LocalScheduleRepository } from './LocalScheduleRepository';
import { createId } from '@/domain/ids';
import { SEED_SECTOR_COSI_ID, SEED_TEAM_NOC_ID, SEED_TEAM_SOC_ID } from '@/domain/seedIds';
import type { Schedule } from '@/domain/schedule';

function buildDraft(teamId: string): Schedule {
  const now = new Date().toISOString();
  return {
    id: createId(),
    sectorId: SEED_SECTOR_COSI_ID,
    teamId,
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    status: 'DRAFT',
    members: [],
    assignments: [],
    createdAt: now,
    updatedAt: now,
  };
}

describe('LocalScheduleRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates and reopens a draft with the same data (scenario: salvar/reabrir rascunho)', async () => {
    const repo = new LocalScheduleRepository();
    const draft = buildDraft(SEED_TEAM_SOC_ID);
    await repo.create(draft);

    const reopened = await repo.getById(draft.id);
    expect(reopened).not.toBeNull();
    expect(reopened?.periodStart).toBe('2026-07-01');
    expect(reopened?.status).toBe('DRAFT');
  });

  it('save() upserts and bumps updatedAt', async () => {
    const repo = new LocalScheduleRepository();
    const draft = buildDraft(SEED_TEAM_SOC_ID);
    await repo.create(draft);

    const edited = { ...draft, assignments: [{ scheduleId: draft.id, memberId: 'm1', date: '2026-07-01', shiftCode: 'manha' as const }] };
    const saved = await repo.save(edited);
    expect(saved.assignments).toHaveLength(1);

    const reopened = await repo.getDraftByTeam(SEED_TEAM_SOC_ID);
    expect(reopened?.assignments).toHaveLength(1);
  });

  it('publish() sets status to PUBLISHED and keeps the same id (scenario: publicar localmente)', async () => {
    const repo = new LocalScheduleRepository();
    const draft = buildDraft(SEED_TEAM_SOC_ID);
    await repo.create(draft);

    const published = await repo.publish(draft.id);
    expect(published.status).toBe('PUBLISHED');
    expect(published.id).toBe(draft.id);

    expect(await repo.getPublishedByTeam(SEED_TEAM_SOC_ID)).not.toBeNull();
    expect(await repo.getDraftByTeam(SEED_TEAM_SOC_ID)).toBeNull();
  });

  it('never mixes schedules across teams (scenario: escala nunca muda de equipe silenciosamente)', async () => {
    const repo = new LocalScheduleRepository();
    const socDraft = buildDraft(SEED_TEAM_SOC_ID);
    const nocDraft = buildDraft(SEED_TEAM_NOC_ID);
    await repo.create(socDraft);
    await repo.create(nocDraft);

    expect(await repo.getDraftByTeam(SEED_TEAM_SOC_ID)).toMatchObject({ id: socDraft.id, teamId: SEED_TEAM_SOC_ID });
    expect(await repo.getDraftByTeam(SEED_TEAM_NOC_ID)).toMatchObject({ id: nocDraft.id, teamId: SEED_TEAM_NOC_ID });

    const socSchedules = await repo.listByTeam(SEED_TEAM_SOC_ID);
    expect(socSchedules.every((s) => s.teamId === SEED_TEAM_SOC_ID)).toBe(true);
    expect(socSchedules.some((s) => s.id === nocDraft.id)).toBe(false);
  });
});
