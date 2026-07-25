import type { Sector } from '@/domain/sector';
import type { Team } from '@/domain/team';
import type { Member } from '@/domain/member';

export interface OrganizationRepository {
  listSectors(): Promise<Sector[]>;
  getSector(sectorId: string): Promise<Sector | null>;
  listTeamsBySector(sectorId: string): Promise<Team[]>;
  getTeam(teamId: string): Promise<Team | null>;
  listMembersByTeam(teamId: string): Promise<Member[]>;
  addMember(member: Omit<Member, 'id'>): Promise<Member>;
  renameMember(memberId: string, name: string): Promise<Member>;
  removeMember(memberId: string): Promise<void>;
}
