export type ScheduleType =
  | 'SOC_NOC_6X1'
  | 'N1_SERVICE_DESK_6X1'
  | 'PLANTAO_COSI'
  | 'GENERIC';

export interface Team {
  id: string;
  sectorId: string;
  code: string;
  name: string;
  scheduleType: ScheduleType;
  active: boolean;
}
