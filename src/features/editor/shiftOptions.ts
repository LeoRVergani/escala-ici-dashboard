import type { ScheduleType } from '@/domain/team';
import type { ShiftCode } from '@/domain/schedule';

export const SHIFT_OPTIONS_BY_SCHEDULE_TYPE: Record<ScheduleType, ShiftCode[]> = {
  // Real SOC 6×1 spreadsheets routinely carry a madrugada shift (SOC_SHIFT_COLS
  // in src/lib/parser/parser.ts, exercised by the combined-import fixture test)
  // — it was missing here, making it impossible to manually (re)assign in the grid.
  SOC_NOC_6X1: ['madrugada', 'manha', 'tarde', 'noite', 'folga', 'custom'],
  N1_SERVICE_DESK_6X1: ['madrugada', 'manha', 'tarde', 'noite', 'folga', 'extra', 'custom'],
  PLANTAO_COSI: ['plantao', 'folga', 'custom'],
  GENERIC: [
    'madrugada',
    'manha',
    'tarde',
    'noite',
    'folga',
    'ferias',
    'plantao',
    'comercial',
    'extra',
    'afastamento',
    'custom',
  ],
};
