import type { AuditEvent } from '@/domain/auditEvent';
import type { Member } from '@/domain/member';
import type { Organization } from '@/domain/organization';
import type { OrganizationMembership, UserAuthorization } from '@/domain/membership';
import type { Sector } from '@/domain/sector';
import type { Team } from '@/domain/team';
import type { CreateOrganizationInput, OrganizationRepository } from '../OrganizationRepository';
import type { HttpApiClient } from './HttpApiClient';
import { ApiClientError } from './HttpApiClient';

interface ApiOrganization {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

interface ApiArea {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  active: boolean;
}

interface ApiTeam {
  id: string;
  areaId: string;
  code: string;
  name: string;
  scheduleType: Team['scheduleType'];
  active: boolean;
}

interface MeResponse {
  organizations: ApiOrganization[];
  membership: Omit<OrganizationMembership, 'id'>;
  authorization: UserAuthorization;
}

function toOrganization(input: ApiOrganization): Organization {
  return {
    ...input,
    createdByUserId: 'system',
    createdByDisplayName: 'Sistema',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function toSector(input: ApiArea): Sector {
  return {
    id: input.id,
    organizationId: input.organizationId,
    code: input.code,
    name: input.name,
    active: input.active,
  };
}

function toTeam(input: ApiTeam): Team {
  return {
    id: input.id,
    sectorId: input.areaId,
    code: input.code,
    name: input.name,
    scheduleType: input.scheduleType,
    active: input.active,
  };
}

export class HttpOrganizationRepository implements OrganizationRepository {
  private meCache: MeResponse | null = null;
  private readonly apiClient: HttpApiClient;

  constructor(apiClient: HttpApiClient) {
    this.apiClient = apiClient;
  }

  private async me(): Promise<MeResponse> {
    this.meCache ??= await this.apiClient.get<MeResponse>('/api/me');
    return this.meCache;
  }

  async listOrganizationsForUser(_userId: string): Promise<Organization[]> {
    const me = await this.me();
    return me.organizations.map(toOrganization);
  }

  async getOrganization(organizationId: string): Promise<Organization | null> {
    const organizations = await this.listOrganizationsForUser('');
    return organizations.find((organization) => organization.id === organizationId) ?? null;
  }

  async createOrganization(
    _input: CreateOrganizationInput,
    _creator: { userId: string; displayName: string },
  ): Promise<Organization> {
    throw new ApiClientError({
      code: 'NOT_IMPLEMENTED',
      message: 'Criação de organização via API entra no checkpoint de administração.',
      status: 501,
    });
  }

  async getMembership(_userId: string, organizationId: string): Promise<OrganizationMembership | null> {
    const me = await this.me();
    if (me.membership.organizationId !== organizationId) return null;
    return {
      ...me.membership,
      id: `${me.membership.organizationId}:${me.membership.userId}`,
    };
  }

  async getAuthorization(_userId: string, organizationId: string): Promise<UserAuthorization | null> {
    const me = await this.me();
    return me.authorization.organizationId === organizationId ? me.authorization : null;
  }

  async listAuditEvents(_organizationId: string): Promise<AuditEvent[]> {
    return [];
  }

  async listSectors(): Promise<Sector[]> {
    const areas = await this.apiClient.get<ApiArea[]>('/api/areas');
    return areas.map(toSector);
  }

  async getSector(sectorId: string): Promise<Sector | null> {
    const sectors = await this.listSectors();
    return sectors.find((sector) => sector.id === sectorId) ?? null;
  }

  async listTeamsBySector(sectorId: string): Promise<Team[]> {
    const teams = await this.apiClient.get<ApiTeam[]>(`/api/areas/${sectorId}/teams`);
    return teams.map(toTeam);
  }

  async getTeam(teamId: string): Promise<Team | null> {
    const team = await this.apiClient.get<ApiTeam>(`/api/teams/${teamId}`);
    return toTeam(team);
  }

  async listMembersByTeam(_teamId: string): Promise<Member[]> {
    return [];
  }

  async addMember(_member: Omit<Member, 'id'>): Promise<Member> {
    throw new ApiClientError({
      code: 'NOT_IMPLEMENTED',
      message: 'Cadastro de membros via API entra no checkpoint de administração.',
      status: 501,
    });
  }

  async renameMember(_memberId: string, _name: string): Promise<Member> {
    throw new ApiClientError({
      code: 'NOT_IMPLEMENTED',
      message: 'Edição de membros via API entra no checkpoint de administração.',
      status: 501,
    });
  }

  async removeMember(_memberId: string): Promise<void> {
    throw new ApiClientError({
      code: 'NOT_IMPLEMENTED',
      message: 'Remoção de membros via API entra no checkpoint de administração.',
      status: 501,
    });
  }
}
