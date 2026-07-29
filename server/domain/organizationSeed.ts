export type Role = 'USER' | 'MANAGER' | 'ADMIN' | 'DEVELOPER';

export interface UserIdentity {
  id: string;
  displayName: string;
  login: string;
  roles: Role[];
  organizationId: string;
  authorizedSectorIds: string[];
  authorizedTeamIds: string[];
}

export interface Area {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  active: boolean;
}

export interface TeamSummary {
  id: string;
  areaId: string;
  code: string;
  name: string;
  scheduleType: 'SOC_NOC_6X1' | 'PLANTAO_COSI';
  active: boolean;
}

export const SEED_ORG_ICI_ID = '00000000-0000-4000-8000-000000000001';
export const SEED_AREA_COSI_ID = '11111111-1111-4111-8111-111111111111';
export const SEED_TEAM_SOC_ID = '22222222-2222-4222-8222-222222222222';
export const SEED_TEAM_NOC_ID = '33333333-3333-4333-8333-333333333333';
export const SEED_TEAM_PLANTAO_COSI_ID = '44444444-4444-4444-8444-444444444444';

export const AREAS: Area[] = [
  {
    id: SEED_AREA_COSI_ID,
    organizationId: SEED_ORG_ICI_ID,
    code: 'COSI',
    name: 'Coordenadoria de Segurança da Informação',
    active: true,
  },
];

export const TEAMS: TeamSummary[] = [
  {
    id: SEED_TEAM_SOC_ID,
    areaId: SEED_AREA_COSI_ID,
    code: 'SOC',
    name: 'SOC — Escala 6x1',
    scheduleType: 'SOC_NOC_6X1',
    active: true,
  },
  {
    id: SEED_TEAM_NOC_ID,
    areaId: SEED_AREA_COSI_ID,
    code: 'NOC',
    name: 'NOC — Escala 6x1',
    scheduleType: 'SOC_NOC_6X1',
    active: true,
  },
  {
    id: SEED_TEAM_PLANTAO_COSI_ID,
    areaId: SEED_AREA_COSI_ID,
    code: 'PLANTAO_COSI',
    name: 'Plantão COSI',
    scheduleType: 'PLANTAO_COSI',
    active: true,
  },
];

export const DEV_USERS: Record<string, UserIdentity> = {
  claudio: {
    id: 'dev-claudio',
    displayName: 'Claudio',
    login: 'claudio',
    roles: ['MANAGER'],
    organizationId: SEED_ORG_ICI_ID,
    authorizedSectorIds: [SEED_AREA_COSI_ID],
    authorizedTeamIds: [SEED_TEAM_SOC_ID, SEED_TEAM_PLANTAO_COSI_ID],
  },
  lvergani: {
    id: 'dev-lvergani',
    displayName: 'Leonardo Vergani',
    login: 'lvergani',
    roles: ['ADMIN', 'DEVELOPER'],
    organizationId: SEED_ORG_ICI_ID,
    authorizedSectorIds: [SEED_AREA_COSI_ID],
    authorizedTeamIds: [SEED_TEAM_SOC_ID, SEED_TEAM_NOC_ID, SEED_TEAM_PLANTAO_COSI_ID],
  },
};

export function isAdminLike(user: UserIdentity): boolean {
  return user.roles.includes('ADMIN') || user.roles.includes('DEVELOPER');
}

export function canAccessArea(user: UserIdentity, areaId: string): boolean {
  return isAdminLike(user) || user.authorizedSectorIds.includes(areaId);
}

export function canAccessTeam(user: UserIdentity, teamId: string): boolean {
  return isAdminLike(user) || user.authorizedTeamIds.includes(teamId);
}
