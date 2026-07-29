import { createHash } from 'node:crypto';
import { analyzeWorkbook, buildSchedule, readWorkbook } from '../../src/lib/parser/parser.js';
import type { ImportOption, ImportResult, ScheduleState } from '../../src/lib/parser/types.js';

interface BuildImportPreviewInput {
  buffer: Buffer;
  fileName: string;
  teamId: string;
  teamName: string;
  scheduleType: string;
  optionKey?: string;
}

export interface ImportPreviewDto {
  file: {
    name: string;
    size: number;
    extension: string;
  };
  hash: string;
  team: {
    chosen: {
      id: string;
      name: string;
      scheduleType: string;
    };
    detected?: string;
    possibleDivergence: boolean;
  };
  period: {
    start?: string;
    end?: string;
    month: {
      year: number;
      month: number;
    };
  };
  option: Pick<ImportOption, 'key' | 'layout' | 'label' | 'sheetName' | 'recordCount'>;
  canonical: ScheduleState;
  normalizedPackageHash: string;
  summary: {
    collaborators: number;
    logins: number;
    shifts: number;
    specialSituations: number;
    daysOff: number;
    vacations: number;
    absences: number;
    onCallRecords: number;
    emptyCells: number;
  };
  issues: {
    blockingErrors: string[];
    warnings: string[];
    infos: string[];
  };
  counts: {
    sheets: number;
    options: number;
    importedRecords: number;
    recognizedShifts: number;
    customShifts: number;
  };
}

const XLS_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);
const XLSX_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

export function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, '_').slice(0, 160);
}

export function extensionOf(name: string): string {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
}

export function hasValidSpreadsheetSignature(buffer: Buffer, extension: string): boolean {
  if (extension === 'xlsx') return buffer.subarray(0, 4).equals(XLSX_SIGNATURE);
  if (extension === 'xls') return buffer.subarray(0, 4).equals(XLS_SIGNATURE);
  return false;
}

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function chooseOption(options: ImportOption[], optionKey?: string): ImportOption | null {
  if (optionKey) return options.find((option) => option.key === optionKey) ?? null;
  return options.find((option) => option.primary) ?? options[0] ?? null;
}

function inferDetectedTeam(option: ImportOption, state: ScheduleState): string | undefined {
  if (option.layout === 'oncall' || state.viewType === 'oncall') return 'Plantão COSI';
  if (option.layout === 'soc-combined' || option.layout === 'soc-daily' || option.layout === 'soc-escalistas') return 'SOC/NOC 6x1';
  if (option.layout === 'n1') return 'Service Desk N1';
  return undefined;
}

function isPossibleDivergence(scheduleType: string, option: ImportOption, state: ScheduleState): boolean {
  const isOnCall = option.layout === 'oncall' || state.viewType === 'oncall';
  if (scheduleType === 'PLANTAO_COSI') return !isOnCall;
  if (scheduleType === 'SOC_NOC_6X1') return isOnCall;
  return false;
}

function summarize(result: ImportResult): ImportPreviewDto['summary'] {
  let shifts = 0;
  let specialSituations = 0;
  let daysOff = 0;
  let vacations = 0;
  let absences = 0;

  for (const row of Object.values(result.state.cells)) {
    for (const cell of Object.values(row)) {
      if (!cell) continue;
      shifts += 1;
      if (cell.shift === 'folga') daysOff += 1;
      if (cell.shift === 'ferias') vacations += 1;
      if (cell.shift === 'afastamento') absences += 1;
      if (cell.shift === 'custom' || cell.shift === 'extra' || cell.shift === 'ferias' || cell.shift === 'afastamento') {
        specialSituations += 1;
      }
    }
  }

  return {
    collaborators: result.state.technicians.length,
    logins: result.state.technicians.filter((technician) => Boolean(technician.login)).length,
    shifts,
    specialSituations,
    daysOff,
    vacations,
    absences,
    onCallRecords: result.state.onCallRecords?.length ?? 0,
    emptyCells: result.emptyCells,
  };
}

function normalizeCanonicalState(state: ScheduleState): ScheduleState {
  const idMap = new Map<string, string>();
  const technicians = [...state.technicians]
    .sort((a, b) => (a.login ?? a.name ?? a.id).localeCompare(b.login ?? b.name ?? b.id))
    .map((technician, index) => {
      const id = `tech-${String(index + 1).padStart(3, '0')}`;
      idMap.set(technician.id, id);
      return { ...technician, id };
    });

  const cells: ScheduleState['cells'] = {};
  for (const [sourceId, row] of Object.entries(state.cells)) {
    const targetId = idMap.get(sourceId);
    if (targetId) cells[targetId] = row;
  }

  return {
    ...state,
    technicians,
    cells,
    serviceDeskN1: state.serviceDeskN1
      ? {
          ...state.serviceDeskN1,
          principalRows: state.serviceDeskN1.principalRows.map((row) => ({
            ...row,
            technicianId: idMap.get(row.technicianId) ?? row.technicianId,
          })),
          emailGuaranteeRows: state.serviceDeskN1.emailGuaranteeRows.map((row) => ({
            ...row,
            technicianId: idMap.get(row.technicianId) ?? row.technicianId,
          })),
        }
      : undefined,
  };
}

export function buildImportPreview(input: BuildImportPreviewInput): ImportPreviewDto {
  const sanitizedName = sanitizeFileName(input.fileName);
  const extension = extensionOf(sanitizedName);
  const workbook = readWorkbook(input.buffer);
  const analysis = analyzeWorkbook(workbook, sanitizedName);
  const option = chooseOption(analysis.options, input.optionKey);
  if (!option) {
    throw new Error(analysis.errors[0] ?? 'Nenhuma opção de importação reconhecida.');
  }
  const result = buildSchedule(workbook, analysis, option.key);
  const canonical = normalizeCanonicalState({
    ...result.state,
    sourceFileName: sanitizedName,
    sourceSheet: option.sheetName,
    sourceLayout: option.layout,
    officialTeamId: input.teamId,
    origin: 'import',
  });
  const sheet = analysis.sheets.find((candidate) => candidate.sheetName === option.sheetName);
  const detected = inferDetectedTeam(option, canonical);

  return {
    file: {
      name: sanitizedName,
      size: input.buffer.byteLength,
      extension,
    },
    hash: sha256(input.buffer),
    team: {
      chosen: {
        id: input.teamId,
        name: input.teamName,
        scheduleType: input.scheduleType,
      },
      detected,
      possibleDivergence: isPossibleDivergence(input.scheduleType, option, canonical),
    },
    period: {
      start: option.periodStart ?? canonical.dates?.[0],
      end: option.periodEnd ?? canonical.dates?.at(-1),
      month: canonical.monthKey,
    },
    option: {
      key: option.key,
      layout: option.layout,
      label: option.label,
      sheetName: option.sheetName,
      recordCount: option.recordCount,
    },
    canonical,
    normalizedPackageHash: sha256(stableStringify(canonical)),
    summary: summarize({ ...result, state: canonical }),
    issues: {
      blockingErrors: analysis.errors,
      warnings: sheet?.warnings ?? [],
      infos: [`${analysis.options.length} opção(ões) de importação reconhecida(s).`],
    },
    counts: {
      sheets: analysis.sheets.length,
      options: analysis.options.length,
      importedRecords: result.importedRecords ?? 0,
      recognizedShifts: result.recognizedShifts,
      customShifts: result.customShifts,
    },
  };
}
