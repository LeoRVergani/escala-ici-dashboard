export function normalizarTexto(v) {
    if (v === null || v === undefined)
        return '';
    return String(v)
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
}
export function montarChaveDia(d) {
    const ano = d.getUTCFullYear();
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(d.getUTCDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}
export function formatarMinutos(min) {
    const sinal = min < 0 ? '-' : '';
    const absoluto = Math.abs(min);
    const horas = Math.floor(absoluto / 60);
    const minutos = absoluto % 60;
    return `${sinal}${horas}:${String(minutos).padStart(2, '0')}`;
}
