import type { Sector } from './sector';
import type { Team } from './team';
import type { OrganizationMembership, UserAuthorization } from './membership';

export function isSectorAuthorized(sectorId: string, authorization: UserAuthorization | null): boolean {
  return authorization?.sectorIds.includes(sectorId) ?? false;
}

export function isTeamAuthorized(teamId: string, authorization: UserAuthorization | null): boolean {
  return authorization?.teamIds.includes(teamId) ?? false;
}

export function filterAuthorizedSectors(sectors: Sector[], authorization: UserAuthorization | null): Sector[] {
  return sectors.filter((sector) => isSectorAuthorized(sector.id, authorization));
}

export function filterAuthorizedTeams(teams: Team[], authorization: UserAuthorization | null): Team[] {
  return teams.filter((team) => isTeamAuthorized(team.id, authorization));
}

/** A membership can only be dropped to non-ADMIN (or removed) if another ADMIN remains in the organization. */
export function canChangeAwayFromAdmin(
  memberships: OrganizationMembership[],
  membershipId: string,
): boolean {
  const target = memberships.find((m) => m.id === membershipId);
  if (!target || target.role !== 'ADMIN') return true;
  return memberships.some((m) => m.organizationId === target.organizationId && m.role === 'ADMIN' && m.id !== membershipId);
}
