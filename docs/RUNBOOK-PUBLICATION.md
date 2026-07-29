# Runbook Publication

Fluxo seguro:

1. Importar XLS/XLSX.
2. Revisar a escala.
3. Salvar rascunho.
4. Validar no backend.
5. Conferir revisão ativa esperada.
6. Enviar `idempotencyKey`.
7. Confirmar publicação.

Com `ALLOW_OFFICIAL_FIRESTORE_WRITE=false`, o backend valida e retorna estado claro sem gravar.

Parte real controlada exige autorização explícita antes de alterar a flag.
