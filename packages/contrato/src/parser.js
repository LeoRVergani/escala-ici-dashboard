import * as XLSX from 'xlsx';
import { normalizarTexto, montarChaveDia } from './normalizar';
import { calcularTotais } from './totais';
import { SCHEMA_VERSION, } from './tipos';
const TURNOS_PLANILHA = {
    MADRUGADA: 'MD',
    MANHA: 'M',
    TARDE: 'T',
    NOITE: 'N',
};
function isCellObject(v) {
    if (typeof v !== 'object' || v === null)
        return false;
    const record = v;
    return typeof record.t === 'string';
}
function readCell(ws, row, col) {
    const address = XLSX.utils.encode_cell({ r: row, c: col });
    const candidate = ws[address];
    if (!isCellObject(candidate))
        return undefined;
    return candidate.v;
}
function readText(ws, row, col) {
    const value = readCell(ws, row, col);
    return value === undefined ? '' : String(value).trim();
}
function usedRange(ws) {
    const ref = ws['!ref'];
    if (!ref)
        throw new Error('Planilha sem intervalo usado.');
    return XLSX.utils.decode_range(ref);
}
function findCell(ws, wanted) {
    const range = usedRange(ws);
    const wantedNorm = normalizarTexto(wanted);
    for (let row = range.s.r; row <= range.e.r; row += 1) {
        for (let col = range.s.c; col <= range.e.c; col += 1) {
            if (normalizarTexto(readCell(ws, row, col)) === wantedNorm)
                return { row, col };
        }
    }
    return null;
}
function excelColumn(col) {
    return XLSX.utils.encode_col(col);
}
function parseDiaMes(value) {
    if (value === undefined)
        return null;
    const text = String(value).trim();
    const match = /^(\d{1,2})\/(\d{1,2})/.exec(text);
    if (!match)
        return null;
    return { dia: Number(match[1]), mes: Number(match[2]) };
}
function extrairAnoDaAbaEscala(wb) {
    const ws = wb.Sheets.Escala;
    if (!ws)
        return null;
    const range = usedRange(ws);
    for (let row = range.s.r; row <= range.e.r; row += 1) {
        const text = readText(ws, row, 0);
        const match = /\b\d{1,2}\/\d{1,2}\/(\d{4})\b/.exec(text);
        if (match)
            return Number(match[1]);
    }
    return null;
}
function localizarColunasDia(ws, header, anoInicial) {
    const columns = [];
    let ano = anoInicial;
    let mesAnterior = null;
    for (let col = header.col + 1;; col += 1) {
        const diaMes = parseDiaMes(readCell(ws, header.row, col));
        if (!diaMes)
            break;
        if (mesAnterior !== null && diaMes.mes < mesAnterior)
            ano += 1;
        mesAnterior = diaMes.mes;
        columns.push({
            col,
            data: montarChaveDia(new Date(Date.UTC(ano, diaMes.mes - 1, diaMes.dia))),
        });
    }
    return columns;
}
function normalizarEquipeNome(raw) {
    return raw.replace(/\s*x1\s*$/i, '').trim();
}
function encontrarEquipeNome(ws, headerRow) {
    for (let row = 0; row < headerRow; row += 1) {
        const range = usedRange(ws);
        for (let col = range.s.c; col <= range.e.c; col += 1) {
            const value = readText(ws, row, col);
            if (value)
                return normalizarEquipeNome(value);
        }
    }
    return '';
}
function resolverTurno(texto) {
    const normalizado = normalizarTexto(texto);
    const codigo = TURNOS_PLANILHA[normalizado];
    return codigo ? { codigo, texto } : null;
}
function montarAliases(catalogo) {
    const aliases = new Map();
    for (const turno of Object.values(catalogo)) {
        aliases.set(normalizarTexto(turno.codigo), turno);
        for (const alias of turno.aliasesXLS)
            aliases.set(normalizarTexto(alias), turno);
    }
    return aliases;
}
function montarDiaTrabalho(turno, seq) {
    const dia = { c: turno.codigo.toUpperCase() };
    if (turno.horaInicio)
        dia.i = turno.horaInicio;
    if (turno.horaFim)
        dia.f = turno.horaFim;
    dia.m = turno.duracaoMinutos;
    dia.vd = turno.viraDia;
    dia.seq = seq;
    return dia;
}
function montarDiaCatalogo(turno) {
    const dia = { c: turno.codigo.toUpperCase() };
    if (turno.categoria === 'TRABALHO') {
        if (turno.horaInicio)
            dia.i = turno.horaInicio;
        if (turno.horaFim)
            dia.f = turno.horaFim;
        dia.m = turno.duracaoMinutos;
        dia.vd = turno.viraDia;
    }
    return dia;
}
function valorParaTextoErro(value) {
    return value === undefined ? '' : String(value);
}
function parseValorDia(input) {
    const { valor, turnoPadrao, aliases, linha, coluna, login, data, erros } = input;
    if (valor === undefined || String(valor).trim() === '')
        return null;
    if (typeof valor === 'number' && Number.isInteger(valor) && valor >= 1 && valor <= 6) {
        return montarDiaTrabalho(turnoPadrao, valor);
    }
    const textoNormalizado = normalizarTexto(valor).replace(/\s+/g, '');
    const alias = aliases.get(textoNormalizado);
    if (alias)
        return montarDiaCatalogo(alias);
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
export function parsePlanilhaEscala(arquivo, opts) {
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
    const documentos = [];
    const erros = [];
    const avisos = [];
    const turnoCol = turnoHeader.col;
    let turnoAtual = null;
    for (let row = colaborador.row + 1;; row += 1) {
        const login = readText(ws, row, colaborador.col);
        if (!login)
            break;
        const turnoCell = readText(ws, row, turnoCol);
        if (turnoCell) {
            const turnoResolvido = resolverTurno(turnoCell);
            if (turnoResolvido) {
                turnoAtual = turnoResolvido;
            }
            else {
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
        const dias = {};
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
            if (dia)
                dias[day.data] = dia;
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
