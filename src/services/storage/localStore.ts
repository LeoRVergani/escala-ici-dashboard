import type { Sector } from '@/domain/sector';
import type { Team } from '@/domain/team';
import type { Member } from '@/domain/member';
import type { Schedule } from '@/domain/schedule';
import {
  SEED_SECTOR_COSI_ID,
  SEED_TEAM_SOC_ID,
  SEED_TEAM_NOC_ID,
  SEED_TEAM_PLANTAO_COSI_ID,
} from '@/domain/seedIds';

const SCHEMA_VERSION = 1;
const STORAGE_KEY = 'escala-ici:local-store';

export interface LocalStoreShape {
  schemaVersion: number;
  sectors: Sector[];
  teams: Team[];
  members: Member[];
  schedules: Schedule[];
}

function seedData(): LocalStoreShape {
  return {
    schemaVersion: SCHEMA_VERSION,
    sectors: [
      {
        id: SEED_SECTOR_COSI_ID,
        code: 'COSI',
        name: 'Coordenadoria de Segurança da Informação',
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
        sectorId: SEED_SECTOR_COSI_ID,
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
