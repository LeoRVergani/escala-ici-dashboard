import type { Schedule } from '../../src/domain/schedule.js';
import type { UserIdentity } from '../domain/organizationSeed.js';

export interface ScheduleDraftRecord {
  teamId: string;
  schedule: Schedule;
  sourceHash?: string;
  expectedActiveRevision?: number;
  schemaVersion: number;
  savedBy: {
    userId: string;
    login: string;
    displayName: string;
  };
  createdAt: string;
  updatedAt: string;
}

const drafts = new Map<string, ScheduleDraftRecord>();

export function getCurrentDraft(teamId: string): ScheduleDraftRecord | null {
  return drafts.get(teamId) ?? null;
}

export function saveCurrentDraft(input: {
  teamId: string;
  schedule: Schedule;
  sourceHash?: string;
  expectedActiveRevision?: number;
  user: UserIdentity;
}): ScheduleDraftRecord {
  const now = new Date().toISOString();
  const previous = drafts.get(input.teamId);
  const record: ScheduleDraftRecord = {
    teamId: input.teamId,
    schedule: {
      ...input.schedule,
      teamId: input.teamId,
      status: 'DRAFT',
      updatedAt: now,
    },
    sourceHash: input.sourceHash,
    expectedActiveRevision: input.expectedActiveRevision,
    schemaVersion: 1,
    savedBy: {
      userId: input.user.id,
      login: input.user.login,
      displayName: input.user.displayName,
    },
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
  drafts.set(input.teamId, record);
  return record;
}

export function deleteCurrentDraft(teamId: string): boolean {
  return drafts.delete(teamId);
}
