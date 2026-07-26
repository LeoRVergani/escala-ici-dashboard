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
- Ícones: `src/components/AppIcon.tsx` (checkpoint 1C substituiu os glifos
  Unicode/emoji por `lucide-react` — ver seção dedicada "Iconografia" abaixo).

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
| `OrbitBrand` | Marca única do app — ver seção dedicada abaixo |
| `AppIcon` | Único ponto de entrada de ícones — ver seção "Iconografia" abaixo |
| `AppButton` | Toda ação primária/secundária/publicar em todas as páginas |
| `AppIconButton` | Sino de notificações, desfazer/refazer |
| `AppInput` | Formulário de adicionar colaborador |
| `AppSelect` | Demonstrado na página de showcase (nenhum fluxo atual exige um `<select>` nativo — os seletores de tipo de escala são cards, não dropdowns) |
| `AppSearchField` | Demonstrado na página de showcase (sem busca no escopo deste checkpoint) |
| `AppCard` | Cards de setor/equipe/escala em todas as páginas |
| `AppBadge` | Publicado/Rascunho/Sem escala/Validado |
| `AppAlert` | Erros/avisos de validação, erros de importação |

### `OrbitBrand` — marca única, sem implementações independentes por tela

Até o checkpoint 1B, a marca tinha **duas implementações independentes**:
`Brand.tsx` (usado em `/login` e no `Header` das páginas internas) e
`OrbitBrandMark.tsx` (usado só na `OrbitSidebar`). Isso violava o próprio
princípio deste documento — "as páginas não montam... manualmente, todas
consomem os componentes abaixo" — aplicado à identidade visual em si.
Unificado em `src/components/OrbitBrand.tsx`, com `variant`:

| Variant | Composição | Onde |
|---|---|---|
| `login` (padrão) | Ícone da marca oficial num container arredondado, ao lado do wordmark `ESCALA ICI` | `LoginHeader` (`/login`) e `Header` (páginas internas: Setores/Equipes/Escalas) |
| `sidebar` | Ícone da marca oficial num container arredondado + texto `Escala` + `AppBadge` `ICI` | `OrbitSidebar` |
| `compact` | Só o ícone da marca oficial, sem texto | Reservado para contextos de espaço reduzido (nenhum uso real ainda) |

**Asset oficial**: `public/orbita-mark.webp` — arquivo de marca fornecido
pelo usuário (fonte: `escala-ici-mark_f99b5596.webp`), com canal alfa real
(fundo transparente, confirmado via inspeção do canal alpha). Substituiu o
antigo `public/favicon.svg` (um swoosh placeholder diferente, usado apenas
como ícone da aba do navegador até então) e o antigo quadrado-lettermark
`ICI` que o `login` usava antes deste ajuste. Todas as três variantes
consomem o mesmo `ORBITA_MARK_SRC` exportado por `OrbitBrand.tsx` — nunca um
segundo asset divergente — ver `OrbitBrand.test.tsx`, que trava isso. O
favicon da aba (`index.html`) também usa este asset (`public/favicon.png`,
gerado a partir do `.webp` original em 512×512).

### `AppIcon` — conjunto único de ícones, nunca emoji/glifo/import solto

Até o checkpoint 1C, todo ícone da aplicação era um glifo Unicode/emoji
literal (`🔔`, `📅`, `⚙`, `✓`, `⚠`, `✕`, `◷`, `∅`, `🔍`, `▾`, etc.),
centralizados em `src/design-system/icons.ts` mas ainda dependentes de fonte
do sistema operacional — a mesma string renderiza com aparência (e às vezes
suporte) diferente entre Linux, Windows, navegador e screenshots de teste.
`icons.ts` foi **removido**; todo ícone agora vem de
[`lucide-react`](https://lucide.dev) (a mesma biblioteca usada pelo projeto
de referência visual em `escala-ici-redesign`, que já usa Radix UI + lucide —
nenhuma segunda biblioteca de ícones foi introduzida), sempre através de
`src/components/AppIcon.tsx`. Nenhuma página ou componente importa
`lucide-react` diretamente.

**API**:

```ts
<AppIcon
  name="bell"           // AppIconName — um dos ~34 nomes do registro interno
  size={18}              // 14 | 16 | 18 | 20 | 24 (padrão: 18)
  tone="muted"            // default | muted | active | success | warning | danger
  strokeWidth={1.75}      // 1.5 | 1.75 | 2 (padrão: 1.75)
  decorative              // padrão: true — aria-hidden, some da árvore de acessibilidade
  label="Notificações"    // obrigatório quando decorative={false}
  className="..."         // classes extras (nunca cor — ver tons)
/>
```

- **Tamanhos**: só os 5 valores de `APP_ICON_SIZES` (14/16/18/20/24) são
  aceitos pelo tipo `AppIconSize` — não há tamanho arbitrário.
- **Espessura**: só os 3 valores de `APP_ICON_STROKE_WIDTHS` (1.5/1.75/2) —
  1.75 é o padrão neutro; 2 fica reservado para ênfase pontual (nunca usado
  como padrão de uma tela inteira).
- **Tons**: cada tom mapeia para um token de cor existente
  (`--color-orbita-*`) — nunca um hex direto. **`default` não aplica nenhuma
  classe de cor** — o ícone herda `currentColor` do elemento pai. Isso não é
  um detalhe cosmético: um ícone com tom fixo dentro de um contêiner que já
  define sua própria cor de texto (ex. a seta no botão branco "Entrar com
  Microsoft") entra em conflito com esse texto — duas classes Tailwind
  `text-*` no mesmo elemento são resolvidas pela ordem em que o Tailwind as
  gera no CSS final, **não** pela ordem dos atributos JSX, então a cor
  "vencedora" é imprevisível. Deixar `default` sem classe evita o conflito
  inteiramente, herdando a cor correta do contexto.
- **Decorativo vs. informativo**: `decorative` (padrão `true`) marca
  `aria-hidden="true"` — usado sempre que o ícone acompanha um texto visível
  equivalente. `decorative={false}` marca `role="img"` + `aria-label={label}`
  — obrigatório em controles somente-ícone que não têm outro nome acessível
  próprio (ex. `ConflictIndicator`, cujo `aria-label` é o próprio texto do
  alerta). Em botões-ícone que já recebem `aria-label`/`title` de fora (ex.
  `AppIconButton label="Notificações"`), o ícone interno permanece
  `decorative` — o nome acessível já existe no elemento pai, duplicá-lo no
  SVG seria redundante.
- **Proibido**: emoji, glifo Unicode solto (✓ ✕ ⚠ ↩ ↪ etc.) ou
  `import { X } from 'lucide-react'` fora de `AppIcon.tsx`, em qualquer
  página ou componente. Testes automatizados (`AppIcon.test.tsx` e um guard
  de todo o `src/`) travam isso — ver seção de testes.

Mapeamento completo de nomes → ícone lucide está em `AppIcon.tsx`
(`ICONS`); a página de showcase (`/dev/design-system`, seção "Iconografia")
renderiza o conjunto inteiro, todos os tamanhos e todos os tons — use-a para
conferir visualmente antes de adicionar um ícone novo.

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
- Checkpoint 1C (ícones): `ScheduleGrid`/`ScheduleCell`/`CellActionMenu` não
  ganharam ícones novos para conceitos que a auditoria confirmou não
  existirem hoje como elemento visual (usuário, observação/comentário, drag
  handle) — a grade do editor já está aprovada, e inventar posições de ícone
  novas ali seria alterar seu visual aprovado, não apenas trocar um glifo por
  um vetor. Só `ConflictIndicator` (que já tinha um `⚠` real) foi migrado.
  Se um checkpoint futuro adicionar de fato essas informações à grade
  (autor da observação, alça de arraste visível, etc.), ele deve usar
  `AppIcon` desde o início.
