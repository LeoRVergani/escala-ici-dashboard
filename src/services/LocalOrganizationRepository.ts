import type { Sector } from '@/domain/sector';
import type { Team } from '@/domain/team';
import type { Member } from '@/domain/member';
import { createId } from '@/domain/ids';
import { localStore } from './storage/localStore';
import type { OrganizationRepository } from './OrganizationRepository';

export class LocalOrganizationRepository implements OrganizationRepository {
  async listSectors(): Promise<Sector[]> {
    return localStore.read().sectors.filter((s) => s.active);
  }

  async getSector(sectorId: string): Promise<Sector | null> {
    return localStore.read().sectors.find((s) => s.id === sectorId) ?? null;
  }

  async listTeamsBySector(sectorId: string): Promise<Team[]> {
    return localStore
      .read()
      .teams.filter((t) => t.sectorId === sectorId && t.active);
  }

  async getTeam(teamId: string): Promise<Team | null> {
    return localStore.read().teams.find((t) => t.id === teamId) ?? null;
  }

  async listMembersByTeam(teamId: string): Promise<Member[]> {
    return localStore
      .read()
      .members.filter((m) => m.teamId === teamId && m.active);
  }

  async addMember(member: Omit<Member, 'id'>): Promise<Member> {
    const store = localStore.read();
    const created: Member = { ...member, id: createId() };
    store.members.push(created);
    localStore.write(store);
    return created;
  }

  async renameMember(memberId: string, name: string): Promise<Member> {
    const store = localStore.read();
    const member = store.members.find((m) => m.id === memberId);
    if (!member) throw new Error(`Member not found: ${memberId}`);
    member.name = name;
    localStore.write(store);
    return member;
  }

  async removeMember(memberId: string): Promise<void> {
    const store = localStore.read();
    const member = store.members.find((m) => m.id === memberId);
    if (member) member.active = false;
    localStore.write(store);
  }
}
