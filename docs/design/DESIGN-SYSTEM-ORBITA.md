# Design System — Órbita de Turnos

Contrato do Design System usado por todo o dashboard. A aparência vem
inteiramente do protótipo HTML aprovado (ver
[`ORBITA-DE-TURNOS.md`](./ORBITA-DE-TURNOS.md) e
[`DESIGN-TOKENS.md`](./DESIGN-TOKENS.md)) — este documento descreve como essa
aparência foi transformada em componentes reutilizáveis, não uma nova
identidade visual.

Página de demonstração viva (somente em desenvolvimento):
`http://localhost:5173/dev/design-system` (rota registrada apenas quando
`import.meta.env.DEV`, nunca em produção — ver `src/app/App.tsx`).

## Ordem de construção

Tokens → componentes básicos → componentes de navegação/overlay →
componentes da grade → páginas. As páginas não montam botões, modais, menus
ou alertas manualmente — todas consomem os componentes abaixo.

## Tokens (`src/index.css`)

Todo o bloco `@theme` do Tailwind v4 compila para custom properties reais em
`:root` (ex. `--color-orbita-blue`), então a mesma fonte serve como tokens
Tailwind *e* como tokens CSS centralizados:

- Cores de superfície, ação, semânticas e de turno — ver `DESIGN-TOKENS.md`.
- Raios: `--radius-control` (10px), `--radius-card-sm` (16px), `--radius-card`
  (20px), `--radius-pill` (999px).
- Tamanhos de controle: `--size-control-height`, `--size-control-height-sm`,
  `--size-icon-sm`, `--size-icon-md`.
- Sombra: `--shadow-overlay`, reservada para elementos flutuantes (menus,
  diálogos, drawers, toasts) — o protótipo é quase inteiramente flat
  (profundidade via bordas/superfícies em camadas), conforme `ideas.md`.
- Movimento: `--duration-fast/base/slow`, e `prefers-reduced-motion` é
  respeitado globalmente.
- Estado de foco: `--focus-ring-color/width/offset`, aplicado via a classe
  utilitária `.focus-ring` (usa `:focus-visible`, nunca aparece em cliques de
  mouse).
- Breakpoints: os padrões do Tailwind (`sm`/`md`/`lg`/`xl`), que já é o que o
  protótipo compilado usa (confirmado via grep no CSS gerado).
- Ícones: `src/design-system/icons.ts` — glifos Unicode/emoji centralizados
  (o próprio protótipo usa glifos simples, não uma biblioteca de ícones SVG;
  manter esse padrão evita introduzir um sistema visual novo).

## Acessibilidade (transversal a todos os componentes interativos)

- **Foco visível**: classe `.focus-ring` (`:focus-visible`) em todo elemento
  focável — botões, inputs, itens de menu.
- **Escape**: fecha `AppDialog`, `AppConfirm`, `AppDrawer`, `AppDropdownMenu`
  e `CellActionMenu`.
- **Focus trap + retorno de foco**: `src/design-system/useFocusTrap.ts`,
  usado por `AppDialog`/`AppConfirm`/`AppDrawer` — move o foco para dentro ao
  abrir, prende Tab/Shift+Tab, devolve o foco ao elemento que tinha foco antes
  ao fechar.
- **ARIA**: `role="dialog"` + `aria-modal` + `aria-labelledby` nos diálogos;
  `role="menu"`/`role="menuitem"` nos menus; `role="alert"`/`role="status"`
  nos alertas/toasts conforme severidade; `role="tablist"`/`role="tab"` em
  `AppTabs`; `aria-invalid`/`aria-errormessage` em `AppInput` com erro.
- **Loading/disabled/erro**: padrão consistente — `disabled:opacity-40` em
  todo controle interativo; `AppLoadingState` para carregamento; `AppAlert`/
  `AppInput error` para erro.

## Componentes básicos (`src/components/`)

| Componente | Uso real no app |
|---|---|
| `AppButton` | Toda ação primária/secundária/publicar em todas as páginas |
| `AppIconButton` | Sino de notificações, desfazer/refazer |
| `AppInput` | Formulário de adicionar colaborador |
| `AppSelect` | Demonstrado na página de showcase (nenhum fluxo atual exige um `<select>` nativo — os seletores de tipo de escala são cards, não dropdowns) |
| `AppSearchField` | Demonstrado na página de showcase (sem busca no escopo deste checkpoint) |
| `AppCard` | Cards de setor/equipe/escala em todas as páginas |
| `AppBadge` | Publicado/Rascunho/Sem escala/Validado |
| `AppAlert` | Erros/avisos de validação, erros de importação |

## Componentes de navegação/overlay (`src/components/`)

| Componente | Uso real no app |
|---|---|
| `AppToast` (+ `ToastProvider`/`useToast`) | Confirmações de salvar/publicar/adicionar/remover colaborador |
| `AppDialog` | Base de `AppConfirm`; formulário "Adicionar colaborador" |
| `AppConfirm` | Confirmação de publicação local |
| `AppDrawer` | Painel "Remover colaborador" |
| `AppDropdownMenu` + `AppDropdownItem` | "Mais ações" do editor; menu do usuário no cabeçalho |
| `AppTooltip` | Rótulos de desfazer/refazer |
| `AppTabs` | Alternância "Criar vazia" / "Importar XLS/XLSX" |
| `AppBreadcrumb` | Cápsula "COSI / SOC" no cabeçalho; linha de contexto nas páginas |
| `AppEmptyState` | "Nenhum setor disponível", "Nenhum colaborador nesta escala" |
| `AppLoadingState` | Todo carregamento assíncrono de listagem |
| `AppPageHeader` | Cabeçalho de título/subtítulo das páginas de setor/equipe |

## Componentes da grade (`src/features/editor/`)

| Componente | Responsabilidade |
|---|---|
| `ScheduleToolbar` | Desfazer/refazer, salvar, contagem de alertas, "Mais ações" |
| `ScheduleGrid` | Orquestra seleção, menu de célula e drag-and-drop |
| `ScheduleCell` | Uma célula colaborador×dia — liga `ShiftBadge` + `SelectionOverlay` |
| `ShiftBadge` | Chip colorido de turno (Md/M/T/N/Folga/…) |
| `CellActionMenu` | Menu de célula: portal, `fixed`, clampado, Escape/clique fora |
| `DragPreview` | Selo flutuante que segue o ponteiro durante o arraste |
| `SelectionOverlay` | Realce de seleção/alvo de drop, desenhado sobre a célula |
| `ConflictIndicator` | Ícone de alerta ao lado do nome do colaborador com aviso de validação |

## O que não foi feito e por quê

- Nenhuma biblioteca visual nova (Tailwind já era a tecnologia do próprio
  protótipo — mantida, não substituída; nada como shadcn foi introduzido).
- `AppSelect`/`AppSearchField` não têm um ponto de uso real nas telas atuais
  além da página de demonstração — foram construídos porque o escopo os
  exige explicitamente, mas nenhuma tela foi forçada a usá-los sem
  necessidade genuína.
- Navegação por setas (roving tabindex) dentro de `AppDropdownMenu` não foi
  implementada — Tab/Shift+Tab e Escape cobrem o necessário para este
  checkpoint; um padrão de teclado mais completo (setas ↑/↓) fica para um
  checkpoint futuro caso se mostre necessário.
