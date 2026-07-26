import type { Sector } from '@/domain/sector';
import type { Team } from '@/domain/team';
import type { Member } from '@/domain/member';
import type { Schedule } from '@/domain/schedule';
import type { Organization } from '@/domain/organization';
import type { OrganizationMembership, UserAuthorization } from '@/domain/membership';
import type { AuditEvent } from '@/domain/auditEvent';
import { createId } from '@/domain/ids';
import {
  SEED_ORG_ICI_ID,
  SEED_SECTOR_COSI_ID,
  SEED_SECTOR_CODB_ID,
  SEED_TEAM_SOC_ID,
  SEED_TEAM_NOC_ID,
  SEED_TEAM_PLANTAO_COSI_ID,
} from '@/domain/seedIds';

const SCHEMA_VERSION = 2;
const STORAGE_KEY = 'escala-ici:local-store';

// Fixed so seeded fixtures/tests are deterministic — not a real creation moment.
const SEED_ICI_CREATED_AT = '2025-06-01T09:00:00.000Z';

export interface LocalStoreShape {
  schemaVersion: number;
  organizations: Organization[];
  memberships: OrganizationMembership[];
  authorizations: UserAuthorization[];
  auditEvents: AuditEvent[];
  sectors: Sector[];
  teams: Team[];
  members: Member[];
  schedules: Schedule[];
}

function seedData(): LocalStoreShape {
  return {
    schemaVersion: SCHEMA_VERSION,
    organizations: [
      {
        id: SEED_ORG_ICI_ID,
        code: 'ICI',
        name: 'ICI',
        description: 'Instituto das Cidades Inteligentes',
        active: true,
        createdByUserId: 'dev-claudio',
        createdByDisplayName: 'Claudio',
        createdAt: SEED_ICI_CREATED_AT,
      },
    ],
    memberships: [
      { id: createId(), organizationId: SEED_ORG_ICI_ID, userId: 'dev-claudio', role: 'ADMIN' },
      { id: createId(), organizationId: SEED_ORG_ICI_ID, userId: 'dev-wmoriyama', role: 'SCHEDULE_MANAGER' },
    ],
    authorizations: [
      {
        userId: 'dev-claudio',
        organizationId: SEED_ORG_ICI_ID,
        sectorIds: [SEED_SECTOR_COSI_ID],
        teamIds: [SEED_TEAM_SOC_ID, SEED_TEAM_PLANTAO_COSI_ID],
      },
      {
        userId: 'dev-wmoriyama',
        organizationId: SEED_ORG_ICI_ID,
        sectorIds: [SEED_SECTOR_CODB_ID],
        teamIds: [SEED_TEAM_NOC_ID],
      },
    ],
    auditEvents: [
      {
        id: createId(),
        organizationId: SEED_ORG_ICI_ID,
        type: 'ORGANIZATION_CREATED',
        actorUserId: 'dev-claudio',
        actorDisplayName: 'Claudio',
        occurredAt: SEED_ICI_CREATED_AT,
      },
    ],
    sectors: [
      {
        id: SEED_SECTOR_COSI_ID,
        organizationId: SEED_ORG_ICI_ID,
        code: 'COSI',
        name: 'Coordenadoria de Segurança da Informação',
        active: true,
      },
      {
        id: SEED_SECTOR_CODB_ID,
        organizationId: SEED_ORG_ICI_ID,
        code: 'CODB',
        name: 'CODB',
        active: true,
      },
    ],
    teams: [
      {
        id: SEED_TEAM_SOC_ID,
        sectorId: SEED_SECTOR_COSI_ID,
        code: 'SOC',
        name: 'SOC',
        scheduleType: 'SOC_NOC_6X1',
        active: true,
      },
      {
        id: SEED_TEAM_NOC_ID,
        sectorId: SEED_SECTOR_CODB_ID,
        code: 'NOC',
        name: 'NOC',
        scheduleType: 'SOC_NOC_6X1',
        active: true,
      },
      {
        id: SEED_TEAM_PLANTAO_COSI_ID,
        sectorId: SEED_SECTOR_COSI_ID,
        code: 'PLANTAO_COSI',
        name: 'Plantão COSI',
        scheduleType: 'PLANTAO_COSI',
        active: true,
      },
    ],
    members: [],
    schedules: [],
  };
}

function readStore(): LocalStoreShape {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedData();
    writeStore(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as LocalStoreShape;
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      const seeded = seedData();
      writeStore(seeded);
      return seeded;
    }
    return parsed;
  } catch {
    const seeded = seedData();
    writeStore(seeded);
    return seeded;
  }
}

function writeStore(data: LocalStoreShape): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const localStore = {
  read: readStore,
  write: writeStore,
};
