import * as XLSX from 'xlsx';
import { normalizarCelula, normalizarTexto, montarChaveDia } from './normalizar';
import { calcularTotais } from './totais';
import {
  SCHEMA_VERSION,
  type Dia,
  type ErroImportacao,
  type OpcoesParse,
  type ResultadoParse,
  type TipoTurno,
  type TurnosMes,
} from './tipos';

type CellValue = string | number | boolean | Date;

interface CellPosition {
  row: number;
  col: number;
}

interface DayColumn {
  col: number;
  data: string;
}

interface TurnoPlanilha {
  codigo: string;
  texto: string;
}

const TURNOS_PLANILHA: Record<string, string> = {
  MADRUGADA: 'MD',
  MANHA: 'M',
  TARDE: 'T',
  NOITE: 'N',
};

function isCellObject(v: unknown): v is XLSX.CellObject {
  if (typeof v !== 'object' || v === null) return false;
  const record = v as Record<string, unknown>;
  return typeof record.t === 'string';
}

function readCell(ws: XLSX.WorkSheet, row: number, col: number): CellValue | undefined {
  const address = XLSX.utils.encode_cell({ r: row, c: col });
  const candidate: unknown = ws[address];
  if (!isCellObject(candidate)) return undefined;
  return candidate.v;
}

function readText(ws: XLSX.WorkSheet, row: number, col: number): string {
  const value = readCell(ws, row, col);
  return value === undefined ? '' : String(value).trim();
}

function usedRange(ws: XLSX.WorkSheet): XLSX.Range {
  const ref = ws['!ref'];
  if (!ref) throw new Error('Planilha sem intervalo usado.');
  return XLSX.utils.decode_range(ref);
}

function findCell(ws: XLSX.WorkSheet, wanted: string): CellPosition | null {
  const range = usedRange(ws);
  const wantedNorm = normalizarTexto(wanted);
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      if (normalizarTexto(readCell(ws, row, col)) === wantedNorm) return { row, col };
    }
  }
  return null;
}

function excelColumn(col: number): string {
  return XLSX.utils.encode_col(col);
}

function parseDiaMes(value: CellValue | undefined): { dia: number; mes: number } | null {
  if (value === undefined) return null;
  const text = String(value).trim();
  const match = /^(\d{1,2})\/(\d{1,2})/.exec(text);
  if (!match) return null;
  return { dia: Number(match[1]), mes: Number(match[2]) };
}

function extrairAnoDaAbaEscala(wb: XLSX.WorkBook): number | null {
  const ws = wb.Sheets.Escala;
  if (!ws) return null;
  const range = usedRange(ws);
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    const text = readText(ws, row, 0);
    const match = /\b\d{1,2}\/\d{1,2}\/(\d{4})\b/.exec(text);
    if (match) return Number(match[1]);
  }
  return null;
}

function localizarColunasDia(ws: XLSX.WorkSheet, header: CellPosition, anoInicial: number): DayColumn[] {
  const columns: DayColumn[] = [];
  let ano = anoInicial;
  let mesAnterior: number | null = null;

  for (let col = header.col + 1; ; col += 1) {
    const diaMes = parseDiaMes(readCell(ws, header.row, col));
    if (!diaMes) break;
    if (mesAnterior !== null && diaMes.mes < mesAnterior) ano += 1;
    mesAnterior = diaMes.mes;
    columns.push({
      col,
      data: montarChaveDia(new Date(Date.UTC(ano, diaMes.mes - 1, diaMes.dia))),
    });
  }

  return columns;
}

function normalizarEquipeNome(raw: string): string {
  return raw.replace(/\s*x1\s*$/i, '').trim();
}

function encontrarEquipeNome(ws: XLSX.WorkSheet, headerRow: number): string {
  for (let row = 0; row < headerRow; row += 1) {
    const range = usedRange(ws);
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const value = readText(ws, row, col);
      if (value) return normalizarEquipeNome(value);
    }
  }
  return '';
}

function resolverTurno(texto: string): TurnoPlanilha | null {
  const normalizado = normalizarTexto(texto);
  const codigo = TURNOS_PLANILHA[normalizado];
  return codigo ? { codigo, texto } : null;
}

function montarAliases(catalogo: Record<string, TipoTurno>): Map<string, TipoTurno> {
  const aliases = new Map<string, TipoTurno>();
  for (const turno of Object.values(catalogo)) {
    aliases.set(normalizarCelula(turno.codigo), turno);
    for (const alias of turno.aliasesXLS) aliases.set(normalizarCelula(alias), turno);
  }
  return aliases;
}

function montarDiaTrabalho(turno: TipoTurno, seq: number): Dia {
  const dia: Dia = { c: turno.codigo.toUpperCase() };
  if (turno.horaInicio) dia.i = turno.horaInicio;
  if (turno.horaFim) dia.f = turno.horaFim;
  dia.m = turno.duracaoMinutos;
  dia.vd = turno.viraDia;
  dia.seq = seq;
  return dia;
}

function montarDiaCatalogo(turno: TipoTurno): Dia {
  const dia: Dia = { c: turno.codigo.toUpperCase() };
  if (turno.categoria === 'TRABALHO') {
    if (turno.horaInicio) dia.i = turno.horaInicio;
    if (turno.horaFim) dia.f = turno.horaFim;
    dia.m = turno.duracaoMinutos;
    dia.vd = turno.viraDia;
  }
  return dia;
}

function valorParaTextoErro(value: CellValue | undefined): string {
  return value === undefined ? '' : String(value);
}

function parseValorDia(input: {
  valor: CellValue | undefined;
  turnoPadrao: TipoTurno;
  aliases: Map<string, TipoTurno>;
  linha: number;
  coluna: number;
  login: string;
  data: string;
  erros: ErroImportacao[];
}): Dia | null {
  const { valor, turnoPadrao, aliases, linha, coluna, login, data, erros } = input;
  if (valor === undefined || String(valor).trim() === '') return null;
  if (typeof valor === 'number' && Number.isInteger(valor) && valor >= 1 && valor <= 6) {
    return montarDiaTrabalho(turnoPadrao, valor);
  }

  const textoNormalizado = normalizarCelula(valor);
  const alias = aliases.get(textoNormalizado);
  if (alias) return montarDiaCatalogo(alias);

  erros.push({
    linha: linha + 1,
    coluna: excelColumn(coluna),
    login,
    data,
    valorEncontrado: valorParaTextoErro(valor),
    motivo: 'Valor da escala nao corresponde a numero 1-6 nem a alias do catalogo.',
    sugestao: 'Inclua o valor em aliasesXLS do catalogo ou corrija a planilha.',
  });
  return null;
}

/**
 * Converte a planilha de escala em documentos canônicos. Mesmo quando `ok` for
 * `false`, `documentos` vem preenchido para preview; quem chama não deve
 * persistir quando houver erros.
 */
export function parsePlanilhaEscala(arquivo: ArrayBuffer, opts: OpcoesParse): ResultadoParse {
  const wb = XLSX.read(arquivo, { type: 'array', cellDates: false, cellNF: false, cellStyles: false });
  const ws = wb.Sheets.Escalistas;
  if (!ws) {
    return {
      ok: false,
      equipeNome: '',
      periodoInicio: '',
      periodoFim: '',
      totalDias: 0,
      documentos: [],
      erros: [{
        linha: 0,
        coluna: '',
        valorEncontrado: '',
        motivo: 'Aba Escalistas nao encontrada.',
      }],
      avisos: [],
    };
  }

  const header = findCell(ws, 'DIA/MÊS');
  const colaborador = findCell(ws, 'COLABORADOR');
  const turnoHeader = findCell(ws, 'Turno');
  if (!header || !colaborador || !turnoHeader) {
    return {
      ok: false,
      equipeNome: '',
      periodoInicio: '',
      periodoFim: '',
      totalDias: 0,
      documentos: [],
      erros: [{
        linha: 0,
        coluna: '',
        valorEncontrado: '',
        motivo: 'Cabecalho DIA/MES, Turno ou COLABORADOR nao encontrado.',
      }],
      avisos: [],
    };
  }

  const ano = extrairAnoDaAbaEscala(wb) ?? opts.anoInicio;
  if (!ano) {
    return {
      ok: false,
      equipeNome: encontrarEquipeNome(ws, header.row),
      periodoInicio: '',
      periodoFim: '',
      totalDias: 0,
      documentos: [],
      erros: [{
        linha: header.row + 1,
        coluna: excelColumn(header.col),
        valorEncontrado: '',
        motivo: 'Ano nao encontrado na aba Escala e opts.anoInicio ausente.',
      }],
      avisos: [],
    };
  }

  const dayColumns = localizarColunasDia(ws, header, ano);
  const aliases = montarAliases(opts.catalogo);
  const documentos: TurnosMes[] = [];
  const erros: ErroImportacao[] = [];
  const avisos: string[] = [];
  const turnoCol = turnoHeader.col;
  let turnoAtual: TurnoPlanilha | null = null;

  for (let row = colaborador.row + 1; ; row += 1) {
    const login = readText(ws, row, colaborador.col);
    if (!login) break;

    const turnoCell = readText(ws, row, turnoCol);
    if (turnoCell) {
      const turnoResolvido = resolverTurno(turnoCell);
      if (turnoResolvido) {
        turnoAtual = turnoResolvido;
      } else {
        erros.push({
          linha: row + 1,
          coluna: excelColumn(turnoCol),
          login,
          valorEncontrado: turnoCell,
          motivo: 'Turno da planilha nao reconhecido.',
        });
      }
    }

    if (!turnoAtual) {
      erros.push({
        linha: row + 1,
        coluna: excelColumn(turnoCol),
        login,
        valorEncontrado: turnoCell,
        motivo: 'Turno ausente antes da linha do colaborador.',
      });
      continue;
    }

    const turnoPadrao = opts.catalogo[turnoAtual.codigo];
    if (!turnoPadrao) {
      erros.push({
        linha: row + 1,
        coluna: excelColumn(turnoCol),
        login,
        valorEncontrado: turnoAtual.texto,
        motivo: `Turno ${turnoAtual.codigo} ausente do catalogo.`,
      });
      continue;
    }

    const usuarioUid = opts.loginParaUid[login];
    if (!usuarioUid) {
      erros.push({
        linha: row + 1,
        coluna: excelColumn(colaborador.col),
        login,
        valorEncontrado: login,
        motivo: 'Login ausente do mapa loginParaUid.',
        sugestao: 'Adicione o login ao mapa antes de importar.',
      });
    }

    const dias: Record<string, Dia> = {};
    for (const day of dayColumns) {
      const dia = parseValorDia({
        valor: readCell(ws, row, day.col),
        turnoPadrao,
        aliases,
        linha: row,
        coluna: day.col,
        login,
        data: day.data,
        erros,
      });
      if (dia) dias[day.data] = dia;
    }

    documentos.push({
      schemaVersion: SCHEMA_VERSION,
      usuarioUid: usuarioUid ?? '',
      login,
      equipeId: opts.equipeId,
      competencia: opts.competencia,
      periodoInicio: dayColumns[0]?.data ?? '',
      periodoFim: dayColumns[dayColumns.length - 1]?.data ?? '',
      turnoPadrao: turnoAtual.codigo,
      status: 'RASCUNHO',
      dias,
      totais: calcularTotais(dias, opts.catalogo),
    });
  }

  const periodoInicio = dayColumns[0]?.data ?? '';
  const periodoFim = dayColumns[dayColumns.length - 1]?.data ?? '';
  return {
    ok: erros.length === 0,
    equipeNome: encontrarEquipeNome(ws, header.row),
    periodoInicio,
    periodoFim,
    totalDias: dayColumns.length,
    documentos,
    erros,
    avisos,
  };
}
