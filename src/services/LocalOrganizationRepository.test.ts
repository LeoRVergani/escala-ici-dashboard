import { describe, expect, it, beforeEach } from 'vitest';
import { LocalOrganizationRepository } from './LocalOrganizationRepository';
import { SEED_SECTOR_COSI_ID, SEED_TEAM_NOC_ID, SEED_TEAM_SOC_ID } from '@/domain/seedIds';

describe('LocalOrganizationRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lists COSI as the only sector in the local dev environment (scenario: seleção de COSI)', async () => {
    const repo = new LocalOrganizationRepository();
    const sectors = await repo.listSectors();
    expect(sectors).toHaveLength(1);
    expect(sectors[0].code).toBe('COSI');
  });

  it('filters teams strictly by sectorId (scenario: equipes filtradas pelo sectorId)', async () => {
    const repo = new LocalOrganizationRepository();
    const teams = await repo.listTeamsBySector(SEED_SECTOR_COSI_ID);
    expect(teams.map((t) => t.code).sort()).toEqual(['NOC', 'PLANTAO_COSI', 'SOC']);
    expect(teams.every((t) => t.sectorId === SEED_SECTOR_COSI_ID)).toBe(true);

    const teamsForUnknownSector = await repo.listTeamsBySector('does-not-exist');
    expect(teamsForUnknownSector).toHaveLength(0);
  });

  it('keeps member ids stable after renaming (scenario: IDs permanecem estáveis após renomear nome visível)', async () => {
    const repo = new LocalOrganizationRepository();
    const member = await repo.addMember({
      teamId: SEED_TEAM_SOC_ID,
      name: 'Ana Souza',
      corporateLogin: 'ana.souza',
      active: true,
    });
    const originalId = member.id;

    const renamed = await repo.renameMember(member.id, 'Ana Souza Lima');
    expect(renamed.id).toBe(originalId);
    expect(renamed.name).toBe('Ana Souza Lima');
    expect(renamed.corporateLogin).toBe('ana.souza');

    const members = await repo.listMembersByTeam(SEED_TEAM_SOC_ID);
    expect(members.find((m) => m.id === originalId)?.name).toBe('Ana Souza Lima');
  });

  it('does not leak members between teams', async () => {
    const repo = new LocalOrganizationRepository();
    await repo.addMember({ teamId: SEED_TEAM_SOC_ID, name: 'SOC Person', corporateLogin: 'soc.person', active: true });
    const nocMembers = await repo.listMembersByTeam(SEED_TEAM_NOC_ID);
    expect(nocMembers).toHaveLength(0);
  });

  it('soft-removes members instead of deleting their id', async () => {
    const repo = new LocalOrganizationRepository();
    const member = await repo.addMember({
      teamId: SEED_TEAM_SOC_ID,
      name: 'Temp',
      corporateLogin: 'temp',
      active: true,
    });
    await repo.removeMember(member.id);
    const members = await repo.listMembersByTeam(SEED_TEAM_SOC_ID);
    expect(members.find((m) => m.id === member.id)).toBeUndefined();
  });
});
