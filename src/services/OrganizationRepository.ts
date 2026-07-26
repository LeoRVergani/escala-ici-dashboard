import type { Sector } from '@/domain/sector';
import type { Team } from '@/domain/team';
import type { Member } from '@/domain/member';
import type { Organization } from '@/domain/organization';
import type { OrganizationMembership, UserAuthorization } from '@/domain/membership';
import type { AuditEvent } from '@/domain/auditEvent';

export interface CreateOrganizationInput {
  name: string;
  code: string;
  description?: string;
}

export interface OrganizationRepository {
  listOrganizationsForUser(userId: string): Promise<Organization[]>;
  getOrganization(organizationId: string): Promise<Organization | null>;
  createOrganization(
    input: CreateOrganizationInput,
    creator: { userId: string; displayName: string },
  ): Promise<Organization>;
  getMembership(userId: string, organizationId: string): Promise<OrganizationMembership | null>;
  getAuthorization(userId: string, organizationId: string): Promise<UserAuthorization | null>;
  listAuditEvents(organizationId: string): Promise<AuditEvent[]>;

  listSectors(): Promise<Sector[]>;
  getSector(sectorId: string): Promise<Sector | null>;
  listTeamsBySector(sectorId: string): Promise<Team[]>;
  getTeam(teamId: string): Promise<Team | null>;
  listMembersByTeam(teamId: string): Promise<Member[]>;
  addMember(member: Omit<Member, 'id'>): Promise<Member>;
  renameMember(memberId: string, name: string): Promise<Member>;
  removeMember(memberId: string): Promise<void>;
}
