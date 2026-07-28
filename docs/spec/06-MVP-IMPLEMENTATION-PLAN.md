# 06 — Plano de implementação (checkpoints 1-8)

Cada checkpoint = uma sessão de trabalho: clonar a branch
`feature/mvp-firebase-kmp-publication` (já criada e empurrada por este
Prompt 0), auditar o estado real (pode estar mais avançado que o esperado
— nunca resetar), implementar, testar, documentar, commitar, dar push, só
então liberar o checkpoint seguinte.

## Checkpoint 1 — Backend Express e configuração segura
Igual ao Prompt 1 original do pedido, sem mudanças de escopo.

## Checkpoint 2 — Identidade, RBAC e equipes
Usar o modelo `Organization`/`Sector`/`Team`/`OrganizationMembership` já
existente em `src/domain/` em vez de recriar um modelo paralelo. Usar os
IDs de seed já existentes (`src/domain/seedIds.ts`) em vez dos IDs
candidatos do pedido original.

## Checkpoint 3 — Importação XLS/XLSX e modelo canônico
Igual ao Prompt 3 original. Antes de fechar este checkpoint, ler
`shiftTypeFromAssignment`/`ShiftType` no KMP para produzir a tabela de
mapeamento `ShiftCode` (Dashboard) → `assignmentType`/`shiftName` (KMP)
citada como pendência na spec 04 — sem essa leitura, não inventar o
mapeamento.

## Checkpoint 4 — Editor e estado único
Igual ao Prompt 4 original, **exceto**: não recriar uma tela "Planejador"
separada — este repositório só tem a Grade. Se o produto quiser uma visão
tipo planejador, tratar como pedido novo e explícito, não como parte
implícita deste MVP.

## Checkpoint 5 — Paridade KMP e alertas 6x1
Já em grande parte resolvido pelo checkpoint anterior a este plano (ver
`docs/spec/03-PARIDADE-KMP-ALERTAS-E-GRADE-POR-TURNO.md`, 168 testes
verdes). Este checkpoint deve **auditar se a paridade documentada em 03
ainda é válida** contra a branch KMP mais recente confirmada nesta
auditoria (`feature/fase-14m-icon-orbita-unico`), não refazer do zero.

## Checkpoint 6 — Publicação revisionada no Firebase
Diverge do Prompt 6 original: a publicação precisa escrever em **dois
destinos** (revisionado + espelho de raiz), conforme spec 05. Plantão
COSI fica **fora** deste checkpoint até decisão de produto (spec 04,
risco 1) — publicar apenas SOC e NOC.

## Checkpoint 6b (novo, não estava no pedido original) — Decisão de contrato para Plantão COSI
Checkpoint específico para decidir e documentar como Plantão COSI será
publicado de forma compatível com `oncall_groups`/`oncall_periods`/
`oncall_assignments` do KMP, já que nenhum dos dois repositórios auditados
tem um contrato de escrita comprovado para isso. Não implementar sem essa
decisão.

## Checkpoint 7 — Leitura ativa, histórico e exportação
Igual ao Prompt 7 original, cobrindo apenas SOC/NOC até o Checkpoint 6b
ser resolvido.

## Checkpoint 8 — Trocas, administração, auditoria e notificações
Igual ao Prompt 8 original.

## Checkpoint 9 — UI/UX final, responsividade, PWA e publicação real controlada
Igual ao Prompt 9 original (Parte A sem autorização extra, Parte B só com
autorização explícita do usuário).

## Observação sobre versionamento

`package.json` já está em `0.0.0` no baseline auditado — bate com o
esperado pelo pedido original. Definir `0.1.0` na primeira entrega
integrada permanece válido.
