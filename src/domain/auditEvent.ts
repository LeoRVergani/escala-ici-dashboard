export type AuditEventType = 'ORGANIZATION_CREATED';

export interface AuditEvent {
  id: string;
  organizationId: string;
  type: AuditEventType;
  actorUserId: string;
  actorDisplayName: string;
  occurredAt: string;
}
