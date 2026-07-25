export type ShiftCode =
  | 'madrugada'
  | 'manha'
  | 'tarde'
  | 'noite'
  | 'folga'
  | 'ferias'
  | 'plantao'
  | 'comercial'
  | 'extra'
  | 'afastamento'
  | 'custom';

export type ScheduleStatus = 'DRAFT' | 'PUBLISHED';

export interface Assignment {
  scheduleId: string;
  memberId: string;
  date: string; // ISO date, yyyy-mm-dd
  shiftCode: ShiftCode;
  note?: string;
}

export interface Schedule {
  id: string;
  sectorId: string;
  teamId: string;
  periodStart: string; // ISO date, yyyy-mm-dd
  periodEnd: string; // ISO date, yyyy-mm-dd
  status: ScheduleStatus;
  members: string[]; // Member ids included in this schedule
  assignments: Assignment[];
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}
