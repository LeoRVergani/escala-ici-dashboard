# 02 — Editor de grade: menu de célula e drag-and-drop

Este documento cobre especificamente as duas correções obrigatórias do
escopo (item 11 do briefing original) e como foram validadas.

> Nota: após a primeira versão deste checkpoint, o editor foi refatorado para
> consumir o Design System centralizado (ver
> [`docs/design/DESIGN-SYSTEM-ORBITA.md`](../design/DESIGN-SYSTEM-ORBITA.md)).
> `CellMenu` → `CellActionMenu`, `EditorToolbar` → `ScheduleToolbar`,
> `ShiftPill` → `ShiftBadge`. A célula ganhou um componente próprio
> (`ScheduleCell`), o realce de seleção/alvo de drop virou `SelectionOverlay`,
> o arraste ganhou um selo flutuante (`DragPreview`) que segue o ponteiro, e
> avisos de validação por colaborador ganharam um `ConflictIndicator` ao lado
> do nome. O comportamento e a lógica descritos abaixo não mudaram — apenas
> os nomes dos arquivos/componentes e a origem dos estilos (agora tokens
> centralizados em vez de classes soltas).

## Menu de célula (`src/features/editor/CellActionMenu.tsx`)

Problema original: o menu de célula do dashboard antigo podia ficar
escondido atrás da grade ou cortado por `overflow`.

Implementação:

- Renderizado via `createPortal(..., document.body)` — nunca é filho do
  container com `overflow-auto` da grade, então nunca é clipado por ele.
- `position: fixed`, com posição inicial no ponto do clique (`anchor`).
- Após o primeiro render, mede o próprio tamanho (`getBoundingClientRect`)
  e recalcula `left`/`top` para nunca ultrapassar `window.innerWidth`/
  `innerHeight` (com margem de 8px).
- Fecha em `Escape` (listener em `document`, `keydown`).
- Fecha ao clicar fora (`pointerdown` capturado em `document`, verificando
  `!menuRef.current.contains(event.target)`).
- Funciona após scroll horizontal/vertical porque a posição é calculada a
  partir de coordenadas de viewport (`clientX`/`clientY`), não de offsets
  relativos ao documento.

## Drag-and-drop (`src/features/editor/ScheduleGrid.tsx`)

O escopo pedia para testar primeiro a implementação nativa (HTML5
`draggable`/`dragstart`/`dragover`/`drop`) do dashboard antigo antes de
trocar de abordagem. Como este é um projeto novo (o antigo não foi
reaproveitado), não havia uma implementação nativa "existente" para
testar — a decisão foi ir direto para **Pointer Events**, a alternativa que
o próprio escopo já pré-aprovava, por ser signficativamente mais confiável
para automação em Chromium headless (a API nativa de HTML5 DnD depende de
simulação de SO que é notoriamente instável em ambientes headless).

Comportamento implementado:

- `onPointerDown` numa célula com valor registra a origem (`memberId`,
  `date`, `shiftCode`, `note`) — células vazias não iniciam arraste.
- `onPointerMove` só entra em modo de arraste após um deslocamento mínimo de
  4px (evita conflito com o clique simples que abre o menu). Usa
  `document.elementFromPoint` para encontrar a célula sob o ponteiro via
  atributos `data-member-id`/`data-date`, destacando o alvo.
- `onPointerUp`:
  - Sem arraste real (não passou do threshold) → comporta-se como clique
    normal, abrindo o menu.
  - Mesma linha + `Shift` pressionado → preenche todo o intervalo entre
    origem e destino com o valor de origem ("preencher intervalo na mesma
    linha").
  - Mesma linha, sem `Shift` → move a atribuição (limpa a origem, exceto se
    `Ctrl`/`Alt`/`Cmd` estiver pressionado, que copia em vez de mover).
  - Linha diferente → sempre copia o valor para a célula de destino, sem
    alterar a origem.
  - Nenhuma célula válida sob o ponteiro ao soltar → nenhuma alteração é
    aplicada ("impedir drop inválido").

### Bug real encontrado e corrigido durante o teste manual

A primeira implementação de "mover" chamava duas mutações separadas em
sequência (`setCells` no destino, depois `clearCells` na origem). Ambas
liam o mesmo snapshot de `schedule.assignments` fechado no mesmo evento,
então a segunda chamada desfazia o efeito da primeira — o valor arrastado
desaparecia da grade inteira em vez de mover. Isso só apareceu ao arrastar
de verdade no Chromium real; os handlers "existiam no código" mas o
comportamento estava errado.

Correção: `useScheduleEditor` agora mantém um `ref` síncrono
(`assignmentsRef`) espelhando as atribuições atuais, e uma função atômica
`moveCell` que calcula origem+destino em uma única transformação antes de
aplicar — uma única mutação, um único passo de undo. O mesmo padrão de
`ref` corrigiu um bug análogo em `undo`/`redo` (chamada de `setState` de
dentro do *updater* de outro `setState`, que o React pode invocar mais de
uma vez).

### Validação manual em Chromium real

Testado com Playwright + Chromium real (não simulação):

- `e2e/schedule-flow.spec.ts` — 14 cenários, incluindo arraste
  origem→destino com verificação de bounding box real da célula, e um
  cenário de "drop inválido" que solta o ponteiro fora da grade e confirma
  que os dados não mudam.
- Capturas de tela em `01-login.png` … `14-success.png` (fora do Git,
  diretório de scratchpad da sessão) confirmam visualmente o antes/depois
  do arraste.

## Outras funções do editor

Seleção múltipla (clique/`Shift`+clique por linha/`Ctrl`+clique), copiar/
colar dia e semana, desfazer/refazer, adicionar/remover colaborador — todos
em `src/features/editor/useScheduleEditor.ts`, cobertos por testes
unitários em `useScheduleEditor.test.tsx`.
