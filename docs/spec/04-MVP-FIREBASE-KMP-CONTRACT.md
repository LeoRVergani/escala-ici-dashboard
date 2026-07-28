# 04 — Contrato Firebase/KMP para a publicação oficial do MVP

## Baseline auditado

- Dashboard: `LeoRVergani/escala-ici-dashboard`, branch
  `feature/checkpoint-1-frontend-local-definitivo`, HEAD
  `60844eb44e977e88d303c1321ace213619d5a604` (confere exatamente com o
  baseline esperado). `npm run typecheck`, `npm run test` (168/168, 21
  arquivos) e `npm run build` limpos nesse commit, sem alterações
  pendentes.
- KMP (`LeoRVergani/EscalaICI-KMP-Lab`): a branch candidata indicada no
  pedido (`feature/fase-14j-session-demo-swaps-contract`) **não é** a mais
  recente. `feature/fase-14j1-admin-view-as-member` e
  `feature/fase-14l-icon-splash-dark-blue` a sucedem, e
  `feature/fase-14m-icon-orbita-unico` (idêntica a
  `feature/fase-14n-admin-view-as-member`, mesmo commit) é a ponta real,
  commit `7b4adb14ad0029899fdc7c9be66a91b8228ffbdf`
  (2026-07-25 04:32:51 -0300), descendente confirmada de 14j → 14j1 → 14l.
  Usada como fonte de verdade abaixo.
- Repositório aposentado `LeoRVergani/escala-dashboard`: consultado
  **somente** como contrato já comprovado (conforme autorizado), branch
  `feature/fase-14k-dashboard-orbit-ui-integration` (descendente de 14d/14h),
  commit `a7da41140a798a89f75d8eff93155ba1116a7619`. Contém um backend
  Express/Node já funcional (`server/`) que implementa publicação oficial
  revisionada — não copiado para o novo repo, apenas referenciado como
  prova de contrato.

## Achado central — dois contratos de leitura distintos no KMP, não um

O pedido original presumia um único contrato
`workspaces/{workspaceId}/revisions/{revision}/{collection}` cobrindo tudo.
A auditoria do KMP mostra que existem **dois mecanismos de leitura
paralelos e não intercambiáveis**, ambos ativos em produção:

1. **Identidade organizacional** (`DemoPublicationResolver` +
   `DemoPublicationGateway`, implementado por `FirestoreRestGateway` via
   `loadDocumentFields`/`loadCollectionDocuments`) — usado por
   `organizationIdentityResolver` em `MainActivity.kt`/`Main.kt` tanto para
   o workspace demo (`demo-v1`) quanto para o corporativo
   (`OrganizationWorkspace.CORPORATE_WORKSPACE_ID = "ici-dev"`). Lê
   **exclusivamente** sob
   `workspaces/{workspaceId}/revisions/{activeRevision}/{collection}`, com
   o ponteiro de revisão ativa em `workspaces/{workspaceId}` (campo
   `publicationRevision`, inteiro). Coleções (`DemoPublicationCollections`
   em `DemoPublicationDtos.kt`): `teams`, `members`,
   `member_team_memberships`, `team_manager_assignments`,
   `schedule_periods`, `schedule_assignments`, `schedule_change_requests`.
   Não inclui plantão.

2. **Dados de escala e plantão efetivamente exibidos** (`ScheduleTab`,
   `TodayTab`, `PlantaoScreen`), via `FirebaseScheduleGateway` (também
   implementado por `FirestoreRestGateway`, injetado separadamente em
   `MainActivity.kt` como `firebaseGateway = createFirebaseScheduleGateway()`)
   — lê coleções **de raiz, sem revisão nem workspace**:
   `teams`, `members`, `schedule_periods`, `schedule_assignments`,
   `oncall_groups`, `oncall_periods`, `oncall_assignments`. Este é o
   `sourceType = FIREBASE`, prioridade mais alta em `SourcePriorityPolicy`
   (acima de `DEMO`).

Ou seja: **quem o gestor é, quais equipes ele administra e quem são os
membros** vêm do snapshot revisionado do workspace `ici-dev`; **a escala e
o plantão que aparecem nas telas do app** vêm de coleções de raiz do
Firestore, fora de qualquer revisão. Publicar só em
`workspaces/ici-dev/revisions/{n}/schedule_assignments` (como o pedido
original presumia) **não** alimentaria `ScheduleTab`/`TodayTab`/
`PlantaoScreen` — é preciso também escrever (ou espelhar) em
`schedule_assignments`/`schedule_periods` de raiz, e plantão precisa de
`oncall_groups`/`oncall_periods`/`oncall_assignments` de raiz, que **não
têm equivalente revisionado em nenhum lugar do contrato atual**.

O repositório aposentado confirma que essa distinção já existia antes:
`server/domain/officialPublicationPlanner.mjs` escreve exatamente as
mesmas 7 coleções revisionadas de identidade/escala listadas no item 1
(mais `workspaces/ici-dev` e `publication_records`) e **nunca** grava
`oncall_*` — nenhuma ocorrência no `server/` inteiro daquele repositório.
Plantão nunca foi conectado à publicação oficial revisionada em nenhum dos
dois repositórios auditados.

## Tabela campo a campo

### Coleções revisionadas (`workspaces/ici-dev/revisions/{revision}/...`) — identidade + escala

| Coleção | Campo | Tipo | Obrigatório | Escritor Dashboard | Leitor KMP | Compatível |
|---|---|---|---|---|---|---|
| teams | id | string | sim | a implementar | `toDemoTeam`: `id`/`teamId` | A confirmar no Prompt 1/2 |
| teams | name | string | sim | a implementar | `name`/`teamName` | A confirmar |
| teams | workspaceId | string | sim (implícito, gravado pelo backend) | a implementar | `requiredWorkspaceId()` | A confirmar |
| teams | publicationRevision | int | sim | a implementar | `requiredPublicationRevision` | A confirmar |
| members | id | string | sim | a implementar | `id`/`memberId` | A confirmar |
| members | displayName | string | sim | a implementar | `displayName` (erro se ausente) | A confirmar |
| members | email / emailNormalized | string | não | a implementar | `emailNormalized` ?: `email` ?: "" | A confirmar |
| members | active | bool | não (default true) | a implementar | `active` default true | A confirmar |
| members | corporateLogin | string | não, mas necessário p/ resolução de identidade real | a implementar | `corporateLogin` (lido; comentário no código confirma que o Dashboard antigo já escrevia este campo) | **Crítico — sem este campo a resolução de identidade cai para comparar contra nome/apelido** |
| members | entraTenantId / entraObjectId | string | não | a implementar | lidos, opcionais | A confirmar |
| member_team_memberships | id, memberId, teamId, startDate | string | sim | a implementar | erro se ausentes | A confirmar |
| member_team_memberships | roleId, endDate | string | não | a implementar | opcionais | A confirmar |
| member_team_memberships | active, isPrimary | bool | não (default true/false) | a implementar | defaults | A confirmar |
| team_manager_assignments | id, teamId, managerMemberId (ou memberId), validFrom | string | sim | a implementar | erro se ausentes | A confirmar |
| team_manager_assignments | role | enum string (`PRIMARY_MANAGER`\|`PRIMARY_APPROVER`\|outro→`OTHER`) | não | a implementar | mapeado | A confirmar |
| team_manager_assignments | permissions.* (viewTeamSchedule, viewTeamMembers, editTeamSchedule, approveScheduleChanges, publishSchedule, manageTeamAssignments) | bool (map aninhado) | não | a implementar | lidos individualmente, default false | A confirmar |
| schedule_periods | id/periodId, teamId, startDate, endDate | string | sim | a implementar | erro se ausentes | A confirmar |
| schedule_periods | updatedAt/publishedAt | string | não | a implementar | fallback entre os dois | A confirmar |
| schedule_assignments | id/assignmentId, periodId, teamId, memberId, date | string | sim | a implementar | erro se ausentes | A confirmar |
| schedule_assignments | assignmentType, shiftName | string | sim (ao menos um) | a implementar | `shiftTypeFrom(assignmentType, shiftName)` | **A confirmar contra `ShiftCode` do domínio atual do Dashboard — nomes provavelmente divergem e precisam de mapeamento explícito** |
| schedule_assignments | startTime/startDateTime, endTime/endDateTime | string | não | a implementar | fallback com corte de horário do datetime | A confirmar |
| schedule_change_requests | id, requesterMemberId/memberId, requesterTeamId/teamId, schedulePeriodId/periodId, status, assignedManagerMemberId | string | sim (a maioria) | a implementar | erro se ausentes (exceto os com fallback) | A confirmar |
| workspaces/{id} (ponteiro) | workspaceId, publicationRevision (int), status, workspaceType, scenarioId, seedVersion, allowedDeveloperObjectIds | misto | publicationRevision obrigatório | a implementar | `toWorkspacePointer` | A confirmar |

### Coleções de raiz (sem workspace/revisão) — leitura efetiva de escala e plantão

| Coleção | Campo | Tipo | Obrigatório | Escritor Dashboard | Leitor KMP | Compatível |
|---|---|---|---|---|---|---|
| teams (raiz) | teamId, teamName, active | string/bool | sim | **não existe hoje — gap** | `FirebaseTeamDto` | **Gap: nenhum planner audita­do escreve aqui** |
| members (raiz) | memberId, teamId, displayName, scaleName, active | string/bool | sim | **gap** | `FirebaseMemberDto` | **Gap** |
| members (raiz) | title, role | string | não | gap | opcionais | — |
| schedule_periods (raiz) | periodId, teamId, name, startDate, endDate, active, updatedAt | misto | sim | **gap** | `FirebaseSchedulePeriodDto` | **Gap** |
| schedule_assignments (raiz) | assignmentId, teamId, periodId, memberId, scaleName, date, assignmentType | misto | sim | **gap** | `FirebaseScheduleAssignmentDto` | **Gap** |
| schedule_assignments (raiz) | shiftName, startDateTime, endDateTime, note | string | não | gap | opcionais | — |
| oncall_groups (raiz) | id, teamId, name, active | misto | sim | **gap — sem equivalente em nenhum planner auditado** | `OnCallGroup` | **Gap crítico para Plantão COSI** |
| oncall_periods (raiz) | periodId, teamId, name, startDate, endDate, active, updatedAt, groupId | misto | sim (groupId opcional) | **gap** | `FirebaseOnCallPeriodDto` | **Gap crítico** |
| oncall_assignments (raiz) | onCallId, teamId, periodId, memberId, scaleName, startDateTime, endDateTime, label, active | misto | sim | **gap** | `FirebaseOnCallAssignmentDto` | **Gap crítico** |
| oncall_assignments (raiz) | notes, groupId | string | não | gap | opcionais | — |

## Divergências e riscos a resolver antes do Prompt 6

1. **Plantão COSI não tem hoje nenhum contrato de escrita comprovado em
   nenhum dos dois repositórios.** O modelo de domínio atual do Dashboard
   (`ScheduleType.PLANTAO_COSI`, `Assignment.shiftCode` incluindo
   `'plantao'`) representa plantão como mais um `ShiftCode` dentro de
   `schedule_assignments`. O KMP, porém, modela plantão com **três
   coleções próprias e estrutura diferente** (`groupId`, período separado
   por grupo, `startDateTime`/`endDateTime` completos em vez de
   data+turno). Publicar Plantão COSI como `schedule_assignments` comum
   **não** alimentaria `PlantaoScreen`. Isso é uma incompatibilidade que
   exige decisão de produto — não uma inferência segura para este
   checkpoint. Recomendação: tratar como um prompt/checkpoint à parte
   (após o Prompt 6), não resolver por suposição.
2. **Duplicidade de leitura para SOC/NOC.** Mesmo resolvendo só SOC/NOC, a
   publicação oficial precisa escrever em **dois lugares** (coleções
   revisionadas para identidade + coleções de raiz para o que
   `ScheduleTab`/`TodayTab` realmente leem), ou o KMP precisa passar a ler
   `ScheduleTab`/`TodayTab` do snapshot revisionado — o que também é
   mudança de contrato KMP, fora do escopo autorizado ("não alterar o
   KMP"). A rota mais segura sem tocar no KMP é o backend escrever nos
   dois destinos na mesma transação lógica de publicação.
3. **Mapeamento de `ShiftCode` → `assignmentType`/`shiftName`.** O domínio
   atual do Dashboard usa `ShiftCode` (`madrugada`, `manha`, `tarde`,
   `noite`, `folga`, `ferias`, `plantao`, `comercial`, `extra`,
   `afastamento`, `custom`). O KMP espera `assignmentType`/`shiftName`
   livres, resolvidos por `shiftTypeFromAssignment` (não auditado aqui em
   detalhe — próximo passo antes do Prompt 3/5). Não inventar essa tabela
   de conversão sem ler `shiftTypeFromAssignment` no KMP primeiro.
4. **`corporateLogin` é obrigatório na prática** para a resolução de
   identidade funcionar de verdade (sem ele, cai para comparação por
   nome) — precisa vir do MSAL/diretório corporativo real, não de um
   valor inventado no import XLS.
5. **IDs de sector/team do domínio atual do Dashboard já existem e não
   são os mesmos do pedido original.** O código já tem um modelo
   `Organization → Sector → Team` com seeds fixos
   (`SEED_SECTOR_COSI_ID`, `SEED_SECTOR_CODB_ID`, `SEED_TEAM_SOC_ID`,
   `SEED_TEAM_NOC_ID`, `SEED_TEAM_PLANTAO_COSI_ID` em
   `src/domain/seedIds.ts`) — **não** os IDs candidatos `cosi`/`cosi-soc`/
   `cosi-noc`/`cosi-plantao` sugeridos no pedido. Usar os IDs já
   existentes no domínio, não recriar outros.
6. **Não existe uma tela "Planejador" separada da Grade neste repositório**
   (era um conceito do `escala-dashboard` antigo). O Prompt 4 do pedido
   presume Grade + Planejador como duas telas distintas alimentando o
   mesmo estado — aqui há só a Grade (`ScheduleEditorPage`/`ScheduleGrid`).
   Ajustar o próximo checkpoint para não recriar uma tela que o produto
   atual não tem, a menos que seja pedido explicitamente.

## Não resolvido neste checkpoint (propositalmente)

- Mapeamento completo `assignmentType`/`shiftName` do KMP (requer ler
  `shiftTypeFromAssignment` e `ShiftType` antes do Prompt 3).
- Decisão de produto sobre como (ou se) Plantão COSI será publicado de
  forma compatível com `oncall_*` do KMP.
- Confirmação de quem escreve as coleções de raiz hoje em produção (nenhum
  planner encontrado em nenhum dos dois repositórios — pode ser um script
  manual, seed do Firebase Console, ou processo fora do controle de
  versão; não inventar essa resposta).
