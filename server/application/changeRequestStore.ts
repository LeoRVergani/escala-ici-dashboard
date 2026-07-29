import type { UserIdentity } from '../domain/organizationSeed.js';
import { appendAuditEvent, appendOutboxEvent } from './auditOutboxStore.js';

export type ChangeRequestStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface ChangeRequestRecord {
  id: string;
  workspaceId: string;
  requesterMemberId: string;
  requesterTeamId: string;
  assignedManagerMemberId: string;
  schedulePeriodId: string;
  assignmentId: string;
  requestType: 'SWAP' | 'DAY_CHANGE';
  status: ChangeRequestStatus;
  reason: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedByMemberId?: string;
  resolutionNote?: string;
  schemaVersion: 1;
  publicationRevision: number;
}

const requests = new Map<string, ChangeRequestRecord>();

export function seedChangeRequest(input: Omit<ChangeRequestRecord, 'id' | 'createdAt' | 'schemaVersion'>): ChangeRequestRecord {
  const record: ChangeRequestRecord = {
    ...input,
    id: `change-${requests.size + 1}`,
    createdAt: new Date().toISOString(),
    schemaVersion: 1,
  };
  requests.set(record.id, record);
  return record;
}

export function listChangeRequestsByTeam(teamId: string): ChangeRequestRecord[] {
  return [...requests.values()].filter((request) => request.requesterTeamId === teamId);
}

export function getChangeRequest(id: string): ChangeRequestRecord | null {
  return requests.get(id) ?? null;
}

export function resolveChangeRequest(input: {
  id: string;
  status: 'APPROVED' | 'REJECTED' | 'CANCELLED';
  user: UserIdentity;
  note?: string;
}): ChangeRequestRecord | null {
  const request = requests.get(input.id);
  if (!request) return null;
  request.status = input.status;
  request.resolvedAt = new Date().toISOString();
  request.resolvedByMemberId = input.user.id;
  request.resolutionNote = input.note;
  appendAuditEvent(`CHANGE_REQUEST_${input.status}`, input.user, {
    changeRequestId: request.id,
    teamId: request.requesterTeamId,
  });
  if (input.status === 'APPROVED') {
    appendOutboxEvent('CHANGE_REQUEST_APPROVED', { changeRequestId: request.id, teamId: request.requesterTeamId });
  } else if (input.status === 'REJECTED') {
    appendOutboxEvent('CHANGE_REQUEST_REJECTED', { changeRequestId: request.id, teamId: request.requesterTeamId });
  }
  return request;
}

export function resetChangeRequestStore(): void {
  requests.clear();
}
