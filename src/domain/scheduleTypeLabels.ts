import type { ScheduleType } from './team';

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  SOC_NOC_6X1: '6×1 SOC/NOC',
  N1_SERVICE_DESK_6X1: '6×1 Técnico de TI N1 / Service Desk',
  PLANTAO_COSI: 'Plantão COSI',
  GENERIC: 'Escala genérica',
};

export const SCHEDULE_TYPES: ScheduleType[] = [
  'SOC_NOC_6X1',
  'N1_SERVICE_DESK_6X1',
  'PLANTAO_COSI',
  'GENERIC',
];
