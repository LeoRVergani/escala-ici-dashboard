export type MembershipRole = 'ADMIN' | 'SCHEDULE_MANAGER' | 'VIEWER';

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: MembershipRole;
}

/** Which sectors/teams a user may open within a given organization — never derived from names. */
export interface UserAuthorization {
  userId: string;
  organizationId: string;
  sectorIds: string[];
  teamIds: string[];
}
