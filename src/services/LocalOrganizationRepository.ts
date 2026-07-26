import type { Sector } from '@/domain/sector';
import type { Team } from '@/domain/team';
import type { Member } from '@/domain/member';
import type { Organization } from '@/domain/organization';
import type { OrganizationMembership, UserAuthorization } from '@/domain/membership';
import type { AuditEvent } from '@/domain/auditEvent';
import { createId } from '@/domain/ids';
import { localStore } from './storage/localStore';
import type { CreateOrganizationInput, OrganizationRepository } from './OrganizationRepository';

export class LocalOrganizationRepository implements OrganizationRepository {
  async listOrganizationsForUser(userId: string): Promise<Organization[]> {
    const store = localStore.read();
    const organizationIds = new Set(
      store.memberships.filter((m) => m.userId === userId).map((m) => m.organizationId),
    );
    return store.organizations.filter((org) => org.active && organizationIds.has(org.id));
  }

  async getOrganization(organizationId: string): Promise<Organization | null> {
    return localStore.read().organizations.find((org) => org.id === organizationId) ?? null;
  }

  async createOrganization(
    input: CreateOrganizationInput,
    creator: { userId: string; displayName: string },
  ): Promise<Organization> {
    const store = localStore.read();
    const organization: Organization = {
      id: createId(),
      code: input.code,
      name: input.name,
      description: input.description,
      active: true,
      createdByUserId: creator.userId,
      createdByDisplayName: creator.displayName,
      createdAt: new Date().toISOString(),
    };
    store.organizations.push(organization);
    store.memberships.push({
      id: createId(),
      organizationId: organization.id,
      userId: creator.userId,
      role: 'ADMIN',
    });
    const auditEvent: AuditEvent = {
      id: createId(),
      organizationId: organization.id,
      type: 'ORGANIZATION_CREATED',
      actorUserId: creator.userId,
      actorDisplayName: creator.displayName,
      occurredAt: organization.createdAt,
    };
    store.auditEvents.push(auditEvent);
    localStore.write(store);
    return organization;
  }

  async getMembership(userId: string, organizationId: string): Promise<OrganizationMembership | null> {
    return (
      localStore
        .read()
        .memberships.find((m) => m.userId === userId && m.organizationId === organizationId) ?? null
    );
  }

  async getAuthorization(userId: string, organizationId: string): Promise<UserAuthorization | null> {
    return (
      localStore
        .read()
        .authorizations.find((a) => a.userId === userId && a.organizationId === organizationId) ?? null
    );
  }

  async listAuditEvents(organizationId: string): Promise<AuditEvent[]> {
    return localStore
      .read()
      .auditEvents.filter((event) => event.organizationId === organizationId)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }

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
