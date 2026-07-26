import { describe, expect, it, beforeEach } from 'vitest';
import { LocalOrganizationRepository } from './LocalOrganizationRepository';
import {
  SEED_ORG_ICI_ID,
  SEED_SECTOR_COSI_ID,
  SEED_SECTOR_CODB_ID,
  SEED_TEAM_NOC_ID,
  SEED_TEAM_SOC_ID,
  SEED_TEAM_PLANTAO_COSI_ID,
} from '@/domain/seedIds';

describe('LocalOrganizationRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lists COSI and CODB as the two sectors of the ICI organization (scenario: NOC pertence ao CODB, não ao COSI)', async () => {
    const repo = new LocalOrganizationRepository();
    const sectors = await repo.listSectors();
    expect(sectors.map((s) => s.code).sort()).toEqual(['CODB', 'COSI']);
    expect(sectors.every((s) => s.organizationId === SEED_ORG_ICI_ID)).toBe(true);
  });

  it('filters teams strictly by sectorId — COSI has SOC and Plantão COSI, never NOC', async () => {
    const repo = new LocalOrganizationRepository();
    const teams = await repo.listTeamsBySector(SEED_SECTOR_COSI_ID);
    expect(teams.map((t) => t.code).sort()).toEqual(['PLANTAO_COSI', 'SOC']);
    expect(teams.every((t) => t.sectorId === SEED_SECTOR_COSI_ID)).toBe(true);

    const teamsForUnknownSector = await repo.listTeamsBySector('does-not-exist');
    expect(teamsForUnknownSector).toHaveLength(0);
  });

  it('filters teams strictly by sectorId — CODB has only NOC', async () => {
    const repo = new LocalOrganizationRepository();
    const teams = await repo.listTeamsBySector(SEED_SECTOR_CODB_ID);
    expect(teams.map((t) => t.code)).toEqual(['NOC']);
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

  it('lists ICI for Claudio and for wmoriyama, each with their own authorization', async () => {
    const repo = new LocalOrganizationRepository();

    const claudioOrgs = await repo.listOrganizationsForUser('dev-claudio');
    expect(claudioOrgs.map((o) => o.code)).toEqual(['ICI']);

    const wmoriyamaOrgs = await repo.listOrganizationsForUser('dev-wmoriyama');
    expect(wmoriyamaOrgs.map((o) => o.code)).toEqual(['ICI']);

    const claudioAuth = await repo.getAuthorization('dev-claudio', SEED_ORG_ICI_ID);
    expect(claudioAuth?.sectorIds).toEqual([SEED_SECTOR_COSI_ID]);
    expect(claudioAuth?.teamIds.sort()).toEqual([SEED_TEAM_PLANTAO_COSI_ID, SEED_TEAM_SOC_ID].sort());

    const wmoriyamaAuth = await repo.getAuthorization('dev-wmoriyama', SEED_ORG_ICI_ID);
    expect(wmoriyamaAuth?.sectorIds).toEqual([SEED_SECTOR_CODB_ID]);
    expect(wmoriyamaAuth?.teamIds).toEqual([SEED_TEAM_NOC_ID]);
  });

  it('gives Claudio the ADMIN role and wmoriyama SCHEDULE_MANAGER, never OWNER', async () => {
    const repo = new LocalOrganizationRepository();
    const claudioMembership = await repo.getMembership('dev-claudio', SEED_ORG_ICI_ID);
    expect(claudioMembership?.role).toBe('ADMIN');

    const wmoriyamaMembership = await repo.getMembership('dev-wmoriyama', SEED_ORG_ICI_ID);
    expect(wmoriyamaMembership?.role).toBe('SCHEDULE_MANAGER');
  });

  it('does not grant wmoriyama access to COSI automatically', async () => {
    const repo = new LocalOrganizationRepository();
    const wmoriyamaAuth = await repo.getAuthorization('dev-wmoriyama', SEED_ORG_ICI_ID);
    expect(wmoriyamaAuth?.sectorIds).not.toContain(SEED_SECTOR_COSI_ID);
    expect(wmoriyamaAuth?.teamIds).not.toContain(SEED_TEAM_SOC_ID);
  });

  it('creates an organization with ADMIN role for the creator, createdBy metadata, and an ORGANIZATION_CREATED audit event', async () => {
    const repo = new LocalOrganizationRepository();
    const org = await repo.createOrganization(
      { name: 'Nova Organização', code: 'NOVA' },
      { userId: 'dev-claudio', displayName: 'Claudio' },
    );

    expect(org.createdByUserId).toBe('dev-claudio');
    expect(org.createdByDisplayName).toBe('Claudio');
    expect(org.createdAt).toBeTruthy();

    const membership = await repo.getMembership('dev-claudio', org.id);
    expect(membership?.role).toBe('ADMIN');

    const auditEvents = await repo.listAuditEvents(org.id);
    expect(auditEvents).toHaveLength(1);
    expect(auditEvents[0].type).toBe('ORGANIZATION_CREATED');
    expect(auditEvents[0].actorUserId).toBe('dev-claudio');
  });
});
