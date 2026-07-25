# Design tokens — fonte de verdade visual

Estes valores foram extraídos diretamente do DOM/CSS compilado do protótipo
HTML aprovado como fonte de verdade visual definitiva:

`Abrir-protótipo-interativo-—-Dashboard-Escala-ICI-v2.html`

Não do `ideas.md` (`ORBITA-DE-TURNOS.md` nesta pasta), que documenta a
*intenção* de design e diverge do protótipo em alguns pontos — a diferença
mais notável é a tipografia: `ideas.md` descreve Sora + IBM Plex Sans, mas o
protótipo realmente renderizado usa **Inter** em todo o texto. Onde os dois
documentos divergem, o protótipo (e portanto esta tabela) prevalece.

## Cores base

| Token | Hex | Uso |
|---|---|---|
| `--color-orbita-bg` | `#060B18` | Fundo da página |
| `--color-orbita-surface` | `#0B1728` | Superfícies |
| `--color-orbita-card` | `#0E2035` | Cards |
| `--color-orbita-elevated` | `#122844` | Elementos elevados (badges, hover) |
| `--color-orbita-border` | `#1D4778` | Bordas |
| `--color-orbita-blue` | `#3B82F6` | Azul Órbita — ação/navegação primária |
| `--color-orbita-blue-dark` | `#2563EB` | Hover do azul primário |
| `--color-orbita-blue-darker` | `#1D4ED8` | Estado ativo do azul |
| `--color-orbita-violet` | `#8B5CF6` | Gradiente secundário |
| `--color-orbita-violet-dark` | `#6D28D9` | Gradiente secundário (fim) |
| `--color-orbita-success` | `#18B884` | Sucesso / publicado |
| `--color-orbita-warning` | `#F5B82E` | Aviso / rascunho |
| `--color-orbita-danger` | `#EF4444` | Erro impeditivo |

## Cores de turno (chips da grade)

Extraídas de `style="background: rgb(...)"` inline nos chips do protótipo:

| Turno | RGB | Hex | Texto |
|---|---|---|---|
| Md (madrugada) | `rgb(109,92,231)` | `#6D5CE7` | branco |
| M (manhã) | `rgb(255,210,28)` | `#FFD21C` | escuro (`#060B18`) |
| T (tarde) | `rgb(255,122,26)` | `#FF7A1A` | branco |
| N (noite) | `rgb(37,99,235)` | `#2563EB` | branco |
| Folga | `rgb(34,197,94)` | `#22C55E` | escuro (`#060B18`) |

Os turnos `ferias`, `plantao`, `comercial`, `extra`, `afastamento` e `custom`
não aparecem no protótipo (que só demonstra uma escala SOC 6×1) e receberam
cores derivadas da mesma paleta em `src/components/ShiftPill.tsx` — não são
"pixel-exatas" porque não existe pixel de referência para elas.

## Tipografia

- Fonte única: **Inter** (`400/500/600/700`), carregada via Google Fonts.
- Escala de tamanhos observada: `10px`–`28px` (títulos maiores usam classes
  arbitrárias do Tailwind, ex. `text-[40px]` no hero da landing).

## Raios e formas

- Cards de seção: `20px`–`24px`
- Cards menores/badges: `16px`–`18px`
- Botões: `8px`–`10px` (`rounded-lg`)
- Badges e chips de turno: totalmente arredondados (`9999px`)

## Decoração

- Glow de fundo (login, hero): `bg-gradient-to-br from-[#3B82F6]/20 to-[#6D28D9]/20 blur-[40px]`,
  círculo de `320px`–`480px`, conforme `ideas.md`: "gradientes restritos ao
  login, barras de progresso e confirmação".
- Texto em gradiente (títulos de destaque): `from-[#3B82F6] to-[#8B5CF6] bg-clip-text text-transparent`.
