import { describe, expect, it } from 'vitest';
import {
  isSectorAuthorized,
  isTeamAuthorized,
  filterAuthorizedSectors,
  filterAuthorizedTeams,
  canChangeAwayFromAdmin,
} from './authorization';
import type { Sector } from './sector';
import type { Team } from './team';
import type { OrganizationMembership, UserAuthorization } from './membership';

const COSI: Sector = { id: 'cosi', organizationId: 'ici', code: 'COSI', name: 'COSI', active: true };
const CODB: Sector = { id: 'codb', organizationId: 'ici', code: 'CODB', name: 'CODB', active: true };

const SOC: Team = { id: 'soc', sectorId: 'cosi', code: 'SOC', name: 'SOC', scheduleType: 'SOC_NOC_6X1', active: true };
const NOC: Team = { id: 'noc', sectorId: 'codb', code: 'NOC', name: 'NOC', scheduleType: 'SOC_NOC_6X1', active: true };

const CLAUDIO_AUTH: UserAuthorization = {
  userId: 'dev-claudio',
  organizationId: 'ici',
  sectorIds: ['cosi'],
  teamIds: ['soc'],
};

describe('authorization (scenario: NOC pertence ao CODB, não ao COSI)', () => {
  it('authorizes only the sectors/teams explicitly listed by id, never by name', () => {
    expect(isSectorAuthorized('cosi', CLAUDIO_AUTH)).toBe(true);
    expect(isSectorAuthorized('codb', CLAUDIO_AUTH)).toBe(false);
    expect(isTeamAuthorized('soc', CLAUDIO_AUTH)).toBe(true);
    expect(isTeamAuthorized('noc', CLAUDIO_AUTH)).toBe(false);
  });

  it('treats a missing authorization record as zero access', () => {
    expect(isSectorAuthorized('cosi', null)).toBe(false);
    expect(isTeamAuthorized('soc', null)).toBe(false);
  });

  it('filters sector/team lists down to only what is authorized', () => {
    expect(filterAuthorizedSectors([COSI, CODB], CLAUDIO_AUTH)).toEqual([COSI]);
    expect(filterAuthorizedTeams([SOC, NOC], CLAUDIO_AUTH)).toEqual([SOC]);
  });

  it('never authorizes NOC just because it shares an organization with an authorized sector', () => {
    const authWithCosiOnly: UserAuthorization = { ...CLAUDIO_AUTH, sectorIds: ['cosi'], teamIds: [] };
    expect(isTeamAuthorized('noc', authWithCosiOnly)).toBe(false);
  });
});

describe('canChangeAwayFromAdmin (scenario: sempre deve existir pelo menos um ADMIN)', () => {
  it('blocks removing the last ADMIN of an organization', () => {
    const memberships: OrganizationMembership[] = [
      { id: 'm1', organizationId: 'ici', userId: 'dev-claudio', role: 'ADMIN' },
    ];
    expect(canChangeAwayFromAdmin(memberships, 'm1')).toBe(false);
  });

  it('allows changing an ADMIN away when another ADMIN remains', () => {
    const memberships: OrganizationMembership[] = [
      { id: 'm1', organizationId: 'ici', userId: 'dev-claudio', role: 'ADMIN' },
      { id: 'm2', organizationId: 'ici', userId: 'dev-wmoriyama', role: 'ADMIN' },
    ];
    expect(canChangeAwayFromAdmin(memberships, 'm1')).toBe(true);
  });

  it('allows changing a non-ADMIN membership freely', () => {
    const memberships: OrganizationMembership[] = [
      { id: 'm1', organizationId: 'ici', userId: 'dev-claudio', role: 'ADMIN' },
      { id: 'm2', organizationId: 'ici', userId: 'dev-wmoriyama', role: 'SCHEDULE_MANAGER' },
    ];
    expect(canChangeAwayFromAdmin(memberships, 'm2')).toBe(true);
  });
});
