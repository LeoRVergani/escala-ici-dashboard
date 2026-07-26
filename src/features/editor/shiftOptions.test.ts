import { describe, expect, it } from 'vitest';
import { SHIFT_OPTIONS_BY_SCHEDULE_TYPE } from './shiftOptions';

describe('SHIFT_OPTIONS_BY_SCHEDULE_TYPE (parser parity, checkpoint 1C — PARTE 2)', () => {
  it('SOC_NOC_6X1 includes madrugada — real SOC 6×1 spreadsheets routinely carry it', () => {
    // Regression guard: src/lib/parser/parser.ts's SOC_SHIFT_COLS and its combined-import
    // fixture test both prove madrugada is a real SOC shift; the editor must allow assigning it.
    expect(SHIFT_OPTIONS_BY_SCHEDULE_TYPE.SOC_NOC_6X1).toContain('madrugada');
  });
});
