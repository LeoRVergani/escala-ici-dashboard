import type { UserIdentity } from '../domain/organizationSeed.js';

export type OutboxEventType =
  | 'SCHEDULE_PUBLISHED'
  | 'MEMBER_DAY_CHANGED'
  | 'CHANGE_REQUEST_CREATED'
  | 'CHANGE_REQUEST_APPROVED'
  | 'CHANGE_REQUEST_REJECTED';

export interface AuditEventRecord {
  id: string;
  type: string;
  actor: {
    userId: string;
    login: string;
    displayName: string;
  };
  occurredAt: string;
  metadata: Record<string, unknown>;
}

export interface OutboxEventRecord {
  id: string;
  type: OutboxEventType;
  status: 'PENDING';
  createdAt: string;
  payload: Record<string, unknown>;
}

const auditEvents: AuditEventRecord[] = [];
const outboxEvents: OutboxEventRecord[] = [];

function actor(user: UserIdentity) {
  return {
    userId: user.id,
    login: user.login,
    displayName: user.displayName,
  };
}

export function appendAuditEvent(type: string, user: UserIdentity, metadata: Record<string, unknown>): AuditEventRecord {
  const record: AuditEventRecord = {
    id: `audit-${auditEvents.length + 1}`,
    type,
    actor: actor(user),
    occurredAt: new Date().toISOString(),
    metadata,
  };
  auditEvents.push(record);
  return record;
}

export function appendOutboxEvent(type: OutboxEventType, payload: Record<string, unknown>): OutboxEventRecord {
  const record: OutboxEventRecord = {
    id: `outbox-${outboxEvents.length + 1}`,
    type,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    payload,
  };
  outboxEvents.push(record);
  return record;
}

export function listAuditEvents(): AuditEventRecord[] {
  return [...auditEvents].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export function listOutboxEvents(): OutboxEventRecord[] {
  return [...outboxEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function resetAuditOutboxStore(): void {
  auditEvents.length = 0;
  outboxEvents.length = 0;
}
