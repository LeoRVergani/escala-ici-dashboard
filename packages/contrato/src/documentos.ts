function validarParteId(nome: string, valor: string): string {
  const normalizado = valor.trim();
  if (!normalizado) throw new Error(`${nome} nao pode ser vazio.`);
  if (normalizado.includes('/')) throw new Error(`${nome} nao pode conter barra.`);
  return normalizado;
}

export function idDocumento(equipeId: string, usuarioUid: string, competencia: string): string {
  return [
    validarParteId('equipeId', equipeId),
    validarParteId('usuarioUid', usuarioUid),
    validarParteId('competencia', competencia),
  ].join('_');
}
