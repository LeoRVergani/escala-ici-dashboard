import type { Member } from '../../src/domain/member.js';
import type { Schedule } from '../../src/domain/schedule.js';
import type { UserIdentity } from '../domain/organizationSeed.js';
import { AppError } from '../domain/appError.js';

export interface PublicationRecord {
  revision: number;
  status: 'ACTIVE';
  workspaceId: string;
  teamId: string;
  periodId: string;
  previousRevision: number;
  sourceHash: string;
  packageHash: string;
  idempotencyKey: string;
  counts: {
    members: number;
    assignments: number;
  };
  publishedAt: string;
  publishedBy: {
    userId: string;
    login: string;
    displayName: string;
  };
  activatedAt: string;
  schemaVersion: 1;
  schedule: Schedule;
  members: Member[];
  reason?: string;
}

const activeRevisionByTeam = new Map<string, number>();
const recordsByTeam = new Map<string, PublicationRecord[]>();
const idempotencyByTeam = new Map<string, Map<string, PublicationRecord>>();

export function resetPublicationStore(): void {
  activeRevisionByTeam.clear();
  recordsByTeam.clear();
  idempotencyByTeam.clear();
}

export function getActiveRevision(teamId: string): number {
  return activeRevisionByTeam.get(teamId) ?? 0;
}

export function listPublicationHistory(teamId: string): PublicationRecord[] {
  return [...(recordsByTeam.get(teamId) ?? [])].sort((a, b) => b.revision - a.revision);
}

export function getPublicationRecord(teamId: string, revision: number): PublicationRecord | null {
  return recordsByTeam.get(teamId)?.find((record) => record.revision === revision) ?? null;
}

export function publishRevision(input: {
  workspaceId: string;
  teamId: string;
  schedule: Schedule;
  members: Member[];
  expectedActiveRevision: number;
  idempotencyKey: string;
  sourceHash: string;
  packageHash: string;
  reason?: string;
  user: UserIdentity;
}): PublicationRecord {
  const teamIdempotency = idempotencyByTeam.get(input.teamId) ?? new Map<string, PublicationRecord>();
  idempotencyByTeam.set(input.teamId, teamIdempotency);

  const previousIdempotent = teamIdempotency.get(input.idempotencyKey);
  if (previousIdempotent) return previousIdempotent;

  const currentRevision = getActiveRevision(input.teamId);
  if (currentRevision !== input.expectedActiveRevision) {
    throw new AppError('PUBLICATION_REVISION_CONFLICT', 'A revisão ativa mudou. Recarregue antes de publicar.', 409, {
      activeRevision: currentRevision,
      expectedActiveRevision: input.expectedActiveRevision,
    });
  }

  const revision = currentRevision + 1;
  const now = new Date().toISOString();
  const record: PublicationRecord = {
    revision,
    status: 'ACTIVE',
    workspaceId: input.workspaceId,
    teamId: input.teamId,
    periodId: `${input.schedule.periodStart}_${input.schedule.periodEnd}`,
    previousRevision: currentRevision,
    sourceHash: input.sourceHash,
    packageHash: input.packageHash,
    idempotencyKey: input.idempotencyKey,
    counts: {
      members: input.members.length,
      assignments: input.schedule.assignments.length,
    },
    publishedAt: now,
    publishedBy: {
      userId: input.user.id,
      login: input.user.login,
      displayName: input.user.displayName,
    },
    activatedAt: now,
    schemaVersion: 1,
    schedule: input.schedule,
    members: input.members,
    reason: input.reason,
  };

  recordsByTeam.set(input.teamId, [...(recordsByTeam.get(input.teamId) ?? []), record]);
  activeRevisionByTeam.set(input.teamId, revision);
  teamIdempotency.set(input.idempotencyKey, record);
  return record;
}
