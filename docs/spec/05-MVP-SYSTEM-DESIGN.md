# 05 — Desenho de sistema do MVP Firebase/KMP

## Contexto

Continuação do Prompt 0: auditoria concluída (ver spec 04). Este documento
descreve a arquitetura-alvo para os Prompts 1-8, ajustada aos achados —
principalmente o fato de existirem dois contratos de leitura no KMP
(revisionado para identidade, raiz para escala/plantão exibidos) em vez de
um único contrato revisionado como o pedido original presumia.

## Módulos

Monólito modular, backend novo em `server/` dentro do mesmo repositório
(React/Vite intacto em `src/`):

- `server/domain` — regras de publicação, validação, planejamento de
  escrita (inspirado no padrão comprovado de
  `escala-dashboard/server/domain/officialPublicationPlanner.mjs` e
  `executeAtomicPublication.mjs`, reimplementado em TypeScript, não
  copiado).
- `server/ports` — interfaces (PublicationStore, IdentityGateway, etc.).
- `server/adapters/firebase` — implementação real com `firebase-admin`,
  mais um adapter de emulador para testes.
- `server/adapters/http` — controllers Express finos, sem lógica de
  domínio.
- `server/application` — casos de uso (importar, validar, publicar, ler
  ativo, histórico).

## Fronteiras

- Frontend nunca fala com Firestore diretamente — só com o backend via
  `HttpApiClient`.
- Backend nunca aceita `workspaceId` nem `publicationRevision` do
  cliente — ambos fixos/derivados no servidor, como no padrão já
  comprovado no repositório aposentado.

## Fluxo de publicação (ajustado ao achado da spec 04)

Uma publicação oficial de SOC/NOC precisa gravar em **dois destinos**, na
mesma operação lógica, para que tanto a resolução de identidade quanto as
telas de escala do KMP funcionem:

1. Snapshot revisionado (`workspaces/ici-dev/revisions/{n}/{collection}`)
   para `teams`, `members`, `member_team_memberships`,
   `team_manager_assignments`, `schedule_periods`, `schedule_assignments`,
   `schedule_change_requests` — alimenta a resolução de identidade
   organizacional do KMP.
2. Espelho nas coleções de raiz (`teams`, `members`, `schedule_periods`,
   `schedule_assignments`) no formato `Firebase*Dto` — alimenta
   `ScheduleTab`/`TodayTab`.

Plantão COSI **fica fora da publicação oficial neste MVP** até que exista
uma decisão de produto sobre o contrato `oncall_*` (ver spec 04, risco 1).
Publicar plantão como `schedule_assignments` comum seria uma
incompatibilidade silenciosa com o KMP — não fazer isso sem autorização
explícita.

## Autenticação

- Dev-login: sessão emitida pelo backend, papel nunca vindo do cliente.
- MSAL: `POST /api/auth/exchange-msal-token`, validação de assinatura/
  `aud`/`tid`/`exp`/`nbf`/issuer no backend.
- RBAC usa o modelo já existente no domínio do Dashboard
  (`Organization` → `Sector` → `Team`, `OrganizationMembership` com papéis
  `ADMIN`/`SCHEDULE_MANAGER`/`VIEWER`) — não recriar um modelo
  `USER`/`MANAGER`/`ADMIN`/`DEVELOPER` paralelo sem necessidade
  comprovada; se o pedido original precisar do papel `DEVELOPER`
  (diagnóstico técnico), avaliar como extensão do enum existente, não
  substituição.

## Concorrência e idempotência

Padrão a portar do repositório aposentado (`executeAtomicPublication.mjs`):
reservar a próxima revisão (checagem de `expectedActiveRevision` +
`idempotencyKey`) → escrever documentos da revisão → só então promover o
ponteiro ativo → marcar falha explicitamente em qualquer etapa
intermediária sem promover snapshot incompleto.

## Cache, erros, observabilidade

- Envelope HTTP padrão (`{ ok, data|error, requestId }`).
- `pino` para log estruturado, redaction de tokens.
- Cache de leitura ativa no frontend com invalidação por `updatedAt`/
  `publicationRevision`.

## Segurança

- `ALLOW_OFFICIAL_FIRESTORE_WRITE=false` por padrão.
- Credenciais nunca no Git; `.env.example` sem valores reais.
- `firebase-admin` só no backend.

## Rollback

- Revisões anteriores nunca são apagadas.
- Reverter = publicar uma nova revisão a partir do histórico, nunca editar
  uma revisão existente.
