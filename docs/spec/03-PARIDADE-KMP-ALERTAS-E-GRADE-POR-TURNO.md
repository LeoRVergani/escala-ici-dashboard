# 03 — Paridade KMP (parser/alertas 6x1) e Grade agrupada por turno

## Contexto

Este checkpoint nasceu de um pedido para auditar por que o Dashboard mostrava
14 alertas após importar uma escala SOC e alinhar o parser/motor de alertas
ao contrato do app KMP irmão (`EscalaICI-KMP-Lab`), além de alargar a Grade
e agrupá-la por turno (Md/M/T/N). O pedido original assumia o repositório
`escala-dashboard` (o antigo, hoje aposentado); a auditoria de estado real
mostrou que o trabalho pendente descrito ali já havia sido commitado e
pushado em sessão anterior, e que o projeto ativo é este (`escala-ici-
dashboard`, rebuild visual Órbita). A queixa dos "14 alertas" também não se
aplica literalmente a este repositório — não há nenhum arquivo XLS real
disponível localmente, e `validateSchedule.ts` aqui é praticamente novo
(portado do projeto antigo apenas um dia antes deste checkpoint). O objetivo
foi redirecionado para: levar o motor de alertas deste repositório à
paridade semântica com o KMP, comprovada por testes/fixtures sintéticas —
não por reproduzir uma contagem específica de um arquivo que não existe
aqui. A validação com um arquivo real de escala fica **pendente**.

## Contrato de paridade (Dashboard atual vs. KMP)

Fonte de verdade do KMP: `GenerateLabAlerts`/`LabAlerts.kt` — é o motor
realmente conectado à UI do app (`AlertsTab.kt`). Existe um segundo motor
paralelo (`ScheduleAlertRules`/`ScheduleRules.kt`) que **não** é usado por
nenhuma tela — não foi tratado como referência porque diverge do que o
usuário do KMP realmente vê (sem alerta informativo de "dentro do limite",
sem deduplicação).

| Regra | Dashboard antes deste checkpoint | KMP (canônico) | Situação após este checkpoint |
|---|---|---|---|
| Dia sem atribuição | Contava como trabalho (streak incrementava) | `INDEFINIDO.isWorkShift=false` — quebra a sequência | **Corrigido**: célula vazia agora quebra o streak |
| Disparo do alerta 6x1 | Só uma vez, em `streak === 7` | Dispara em todo dia com `sequence > 6` | **Corrigido**: dispara a cada dia excedente (7º, 8º, 9º...) |
| Adjacência de datas | Walk calendário real dia-a-dia (`datesInPeriod`) | Idêntico (`LabDate.plusDays`) | Já correto — sem mudança |
| Feriado | Não existia nenhum reconhecimento; caía em `custom`, que contava como trabalho | Situação especial nunca é turno de trabalho | **Corrigido**: `feriado` reconhecido (alias + regra SOC) e colapsado em `folga` |
| Descanso mínimo de 11h | Intervalos por turno, noite termina 01h do dia seguinte, comparação cronológica entre turnos de trabalho filtrados | Minutos absolutos, `crossesMidnight`, `HORA_EXTRA` sem minutos excluído do check, `zipWithNext` nos dias de trabalho filtrados | Já equivalente — confirmado por inspeção, sem mudança de lógica |
| Limite do período (25→26) | Parser tem `cycle25To26` correto (com virada de ano), mas editor/validação não olham período adjacente | KMP também não faz stitching entre períodos — cada import é uma "ilha" auto-contida | Já correto por design em ambos — nenhum dos dois infere violação fora do período disponível |
| Severidade | Não existia | `INFO`/`ATENCAO`/`CRITICO` por regra | **Adicionado**: `AlertSeverity` (`info`/`atencao`/`critico`) |
| Deduplicação | Não existia | `distinctBy("$title|$message|$severity|$date")` | **Adicionado**: `dedupKey` determinístico (`memberId|ruleCode|date-ou-message`) |
| Alerta informativo "dentro do limite" | Não existia | Um alerta INFO por resumo quando não há 6x1 crítico | **Adicionado**, por membro (o modelo deste dashboard já é por-membro, diferente do KMP que é por-resumo-de-um-único-colaborador) |
| Turno principal (Md/M/T/N) para agrupamento | Não existia (`visualGrouping` setado no parser, nunca lido) | Também não existe no KMP (só agrupamento por dia: "quem trabalha hoje") | **Novo design**, sem precedente a portar — ver seção própria abaixo |
| HE (hora extra) sem intervalo | Conta para streak, exclui do check de descanso | `HORA_EXTRA.isWorkShift=true`, sem minutos → mesmo comportamento | Já equivalente — sem mudança |

## Contrato de estado único

`XLS/XLSX → parser (src/lib/parser/) → estado canônico (ScheduleState →
convertParsedScheduleToDraft → Schedule/Assignment) → validateSchedule()
(regras/alertas tipados) → seletores de apresentação (ScheduleToolbar,
ConflictIndicator, AlertsPanel, ScheduleGrid) → Grade/publicação`. Toda
edição de célula passa por `useScheduleEditor` (reducer síncrono), o que
recalcula `validateSchedule` a cada render — Grade, badge de alertas,
indicador por linha e o painel de alertas sempre leem o mesmo resultado de
`validateSchedule(editor.schedule, members)`, nunca um cálculo paralelo.
Este repositório não tem uma tela "Planejador" separada (conceito do
`escala-dashboard` antigo) — não se aplica aqui.

## Turno principal — decisão de design

Sem precedente no KMP (que só agrupa colegas *por dia*, nunca um turno
predominante por pessoa ao longo do período) nem no dashboard antigo de
forma funcional (`visualGrouping` existia mas nunca era lido). Módulo novo,
`src/features/editor/primaryShift.ts`:

- Conta, por membro, atribuições nos 4 códigos canônicos
  (`madrugada`/`manha`/`tarde`/`noite`), excluindo `folga`/`ferias`/
  `afastamento`/`plantao`/`comercial`/`extra`/`custom` da contagem.
- Empate resolvido pela ordem fixa `madrugada < manha < tarde < noite`.
- Sem evidência suficiente (zero atribuições canônicas) → categoria
  `'sem-turno-definido'`.
- Recalculado a cada render a partir de `editor.schedule.assignments` — não
  há um campo persistido de "turno do membro"; é sempre derivado. Por
  decisão de produto, o agrupamento não se reordena a cada edição pontual
  de uma célula isolada na prática (o recálculo é barato e determinístico,
  mas uma única célula alterada raramente muda o turno predominante de um
  colaborador com um período inteiro de dados).
- Não existe hoje uma categoria canônica de "folguista"/rotativo distinta
  no modelo de dados (`Member`/`Assignment` não têm esse conceito) — um
  colaborador que cobre um turno excepcionalmente continua contado pelo seu
  turno predominante real no período, não pela cobertura pontual.

## Grade: largura e agrupamento visual

`ScheduleEditorPage.tsx` não usa `OrbitAppShell`/sidebar nesta rota — o
`<main>` foi alargado de `max-w-6xl` (1152px) para `max-w-[1900px]` com
padding responsivo. Medido com Playwright/Chromium headless contra o
servidor de dev real (fixture sintética com 9 colaboradores, período de 31
dias):

| Resolução | Dias visíveis sem scroll | Meta | Situação |
|---|---|---|---|
| 1920×1080 | 24 | ≥20 | Atingida |
| 1366×768 | 16 | ≥13-14 | Atingida |
| 1024×768 | Renderiza sem overflow horizontal indevido da página (scroll fica só dentro do wrapper da grade) | — | Confirmada |
| Zoom 125%/150%/200% (viewport 1024×768) | Sem overflow horizontal do documento em nenhum nível; toolbar quebra em várias linhas via `flex-wrap` já existente | — | Confirmada |

`ScheduleGrid.tsx` ganhou uma prop opcional `primaryShiftByMember`; quando
ausente, renderiza exatamente como antes (lista plana). Quando presente,
insere uma linha de cabeçalho (`colSpan` cobrindo nome + todas as datas,
não-sticky) antes de cada grupo não-vazio, na ordem fixa madrugada → manhã
→ tarde → noite → sem turno definido, preservando a ordem original do
array dentro de cada grupo. Cores reaproveitadas de `SHIFT_STYLES`
(`ShiftBadge.tsx`) — `#6D5CE7`/`#FFD21C`/`#FF7A1A`/`#2563EB`, mais um estilo
neutro para "sem turno definido" — idênticas às já documentadas em
`docs/design/DESIGN-TOKENS.md`, sem conflito. A coluna sticky de
colaborador, seleção multi-célula, drag-and-drop (`data-member-id`/
`data-date`), undo/redo, autosave e a legenda de códigos usados no rodapé
foram confirmados intactos por teste automatizado e por inspeção visual.

## Painel de alertas

O badge estático "X alertas" da toolbar virou um botão (`AppDrawer`
lateral, `AlertsPanel.tsx`) com três seções — Erros impeditivos / Alertas /
Informações — cada item mostrando regra, severidade, colaborador, data e a
mensagem completa. "Ir para" (quando o alerta tem `memberId` e `date`) rola
até a célula via `data-member-id`/`data-date` e aplica um destaque
temporário (`.alert-highlight`, CSS puro em `index.css` — deliberadamente
**não** uma classe Tailwind adicionada via `classList` em runtime, que não
teria CSS gerado pelo JIT). Validado end-to-end com Chromium headless:
abrir o painel, clicar "Ir para" num alerta de 6x1, confirmar que o painel
fecha e a célula correta recebe o destaque visual.

`actionableAlertCount` (badge da toolbar) conta só severidades
`critico`/`atencao` — os informativos de "dentro do limite" não inflam essa
contagem. `warningsByMember` (ícone por linha na Grade) escolhe o warning
de maior severidade por colaborador, não o último do array.

## Testes

- Parser/alertas: `validateSchedule.test.ts` (cenários de paridade KMP —
  6 dias válidos, 7º-9º dia consecutivo, célula vazia quebrando streak,
  interrupção por férias/afastamento/feriado, virada de mês, severidade e
  dedup) e `parser.test.ts` (`normalizeShift('FERIADO')`).
- Turno principal: `primaryShift.test.ts` (predominância clara, empates de
  2 e 3 turnos, membro só com férias/folga, membro sem atribuições, códigos
  não-canônicos ignorados, entrada garantida para todo `memberId`).
- Grade: `ScheduleGrid.test.tsx` (fallback sem grupos, ordem fixa dos
  grupos, ordem preservada dentro do grupo, contagem no cabeçalho,
  regressão de clique/atribuição com agrupamento ativo).
- Painel de alertas: `AlertsPanel.test.tsx` e `ScheduleToolbar.test.tsx`
  (seções condicionais, botão "Ir para" só quando aplicável, callback de
  navegação, estado vazio, abertura do painel pelo botão da toolbar).
- Suíte completa: 168 testes / 21 arquivos, `npm run typecheck` e
  `npm run build` limpos ao final dos 5 checkpoints.

## Limitações reais

- **Validação com arquivo real de escala: pendente.** Não há nenhum XLS/XLSX
  real disponível neste ambiente (nem versionado, nem local-ignorado) — só
  as fixtures sintéticas em `src/lib/parser/fixtures/` e os cenários criados
  para este checkpoint. Quando um arquivo real estiver disponível, repetir
  a importação e comparar a contagem de alertas antes/depois é o próximo
  passo natural.
- O alerta de cobertura de plantão ausente (`onCallGap`) não tem
  equivalente direto no KMP (que não modela "plantão" da mesma forma) — a
  severidade `atencao` atribuída a ele é uma decisão de design deste
  checkpoint, não uma paridade portada.
- "Turno principal" e o agrupamento visual são funcionalidade nova, sem
  contrato a validar contra o KMP — a decisão de tie-break e o fallback
  "sem turno definido" devem ser revisados com o time de produto se algum
  caso real (ex. folguista formal) exigir uma categoria própria.
- Este checkpoint não tocou `OrbitAppShell`/sidebar nem moveu a Grade para
  esse shell — permanece fora de escopo.

## Próximo checkpoint recomendado

Validar a paridade contra um arquivo XLS/XLSX real assim que disponível, e
avaliar se "folguista"/rotativo precisa de uma categoria de agrupamento
própria (hoje cai em "sem turno definido" ou no turno predominante real,
conforme os dados).
