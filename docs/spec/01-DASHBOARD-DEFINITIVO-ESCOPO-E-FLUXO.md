# 01 — Dashboard definitivo: escopo e fluxo (Checkpoint 1)

## Cancelamento do frontend anterior

O frontend anterior em `/home/lvergani/Documentos/Projetos/escala-dashboard`
foi oficialmente cancelado como base do novo dashboard. Este projeto
(`escala-ici-dashboard`) foi criado do zero, com repositório Git próprio, sem
herdar histórico, `App.tsx`, estilos, wizard de publicação ou backend do
projeto antigo. O projeto antigo permanece intacto, isolado e não modificado
— ver seção "Confirmações" no final deste documento.

## Fonte visual — esclarecimento importante

O arquivo enviado como base do redesign,
`escala-ici-redesign (1).zip`, contém em `client/` **o código funcional do
antigo "Dashboard 1.15.3"** (tema claro verde/teal, sem tela de login
dedicada) — não uma implementação do redesign "Órbita de Turnos". O
`ideas.md` dentro do mesmo ZIP documenta a direção visual Órbita como
intenção *ainda não aplicada* àquele código.

Após identificar essa divergência, o usuário confirmou que a fonte de
verdade visual pixel-a-pixel é, em vez disso, o protótipo interativo
autocontido:

`/home/lvergani/Downloads/Abrir-protótipo-interativo-—-Dashboard-Escala-ICI-v2.html`

Esse arquivo é uma página React compilada (Tailwind + Inter) que renderiza,
em uma única página de showcase, todas as telas do fluxo (entrada, minhas
equipes, equipe, importação, grade, conferência, sucesso, solicitações de
troca) mais uma seção de "Sistema de Design" com os tokens exatos (cores,
tipografia, raios). Screenshots de baseline nas resoluções 1366×768,
1920×1080 e 390×844, o DOM completo e o CSS compilado foram capturados antes
de qualquer alteração e usados como referência ao longo da implementação
(guardados fora do Git, em diretório de scratchpad da sessão).

Os tokens exatos extraídos estão documentados em
[`docs/design/DESIGN-TOKENS.md`](../design/DESIGN-TOKENS.md). O `ideas.md`
original foi copiado verbatim para
[`docs/design/ORBITA-DE-TURNOS.md`](../design/ORBITA-DE-TURNOS.md).

O ZIP `escala-ici-redesign (1)` **não foi usado como fonte visual** — apenas
seu `ideas.md` foi copiado para referência histórica, conforme instruído.

## Design System

Antes de montar as páginas, os tokens e componentes reutilizáveis foram
centralizados (tokens → básicos → navegação/overlay → grade → páginas), com
acessibilidade (foco visível, Escape, focus trap, retorno de foco, ARIA)
transversal a todos eles, e uma página de demonstração restrita a
desenvolvimento em `/dev/design-system`. Contrato completo, inventário de
componentes e o que ficou de fora (e por quê) em
[`docs/design/DESIGN-SYSTEM-ORBITA.md`](../design/DESIGN-SYSTEM-ORBITA.md).

## Parser XLS/XLSX

Reaproveitado do projeto antigo (`escala-dashboard/src/lib/parser.ts` e
utilitários diretos), copiado — não importado por caminho relativo — para
`src/lib/parser/` neste projeto. Lógica de parsing idêntica ao original;
único ajuste é o alias de tipo `ShiftId = ShiftCode` (o domínio deste projeto
já usa a mesma união de strings). Ver `src/lib/parser/` e seus testes
(37 casos portados, incluindo os 4 fixtures reais `.xls`/`.xlsx`).

## Fluxo e rotas

Implementadas exatamente as 6 rotas do escopo, sem navegação paralela:

- `/login`
- `/setores`
- `/setores/:sectorId/equipes`
- `/equipes/:teamId/escalas`
- `/equipes/:teamId/escalas/nova` (cobre tanto "criar vazia" quanto
  "importar XLS/XLSX", com aba pré-selecionada via `?mode=empty|import`)
- `/escalas/:scheduleId` (editor; os passos "conferir alterações" e
  "sucesso" são estados internos desta mesma rota, não rotas próprias —
  o escopo original não lista rotas separadas para revisão/publicação)

## Modelos e identificadores

`src/domain/`: `Sector`, `Team`, `Member`, `Schedule`, `Assignment`,
exatamente como especificado (IDs UUID v4 via `crypto.randomUUID()`,
nunca nome/login/slug como chave). Dados de desenvolvimento (setor COSI e
equipes SOC/NOC/Plantão COSI) usam UUIDs fixos em
`src/domain/seedIds.ts` para estabilidade entre reloads.

`Team.scheduleType` determina o conjunto de turnos válidos no editor
(`src/features/editor/shiftOptions.ts`); o seletor de tipo na criação de
escala vazia é uma confirmação visual, já que o modelo `Schedule` não carrega
um campo de tipo próprio (conforme especificado).

## Armazenamento local

`src/services/storage/localStore.ts` — schema versionado
(`schemaVersion: 1`), reseta para os dados semente se a versão mudar. A UI
nunca acessa `localStorage` diretamente: depende só das interfaces
`AuthGateway`, `OrganizationRepository`, `ScheduleRepository`, injetadas via
`src/app/services.tsx`. Implementações deste checkpoint: `DevAuthGateway`,
`LocalOrganizationRepository`, `LocalScheduleRepository`.

## Backend adiado

Nenhuma integração Microsoft/MSAL, Firebase, Firestore, Express ou
publicação remota foi implementada. O botão "Entrar com Microsoft" aparece
visualmente (conforme o protótipo) mas fica desabilitado. A publicação é
inteiramente local, com aviso explícito: *"Publicação local de
desenvolvimento. A integração remota será adicionada após a aprovação deste
frontend."*

## Critérios de aceite deste checkpoint

- [x] Visual pixel-fiel ao protótipo aprovado (cores, tipografia, raios,
      espaçamento) nas 3 resoluções exigidas.
- [x] Fluxo completo funcional: login local → setor → equipe → criar/importar
      → editar → revisar → publicar localmente.
- [x] Menu de célula em portal, não cortado, fecha com Escape/clique fora.
- [x] Drag-and-drop testado manualmente em Chromium real (não apenas
      presença de handlers no código) — ver
      [`docs/spec/02-EDITOR-GRADE-MENU-E-DRAG-DROP.md`](./02-EDITOR-GRADE-MENU-E-DRAG-DROP.md).
- [x] IDs estáveis após renomear; escala nunca muda de equipe silenciosamente.
- [x] `typecheck`, testes (unitários + Playwright) e `build` limpos.
- [x] Projeto antigo intacto; nenhum backend antigo portado; nenhum remoto
      Git criado.

## Confirmações

- `escala-dashboard` (projeto antigo): não modificado — verificado via
  `git status --porcelain` antes e depois do trabalho de portação do parser.
- Nenhum código foi importado por caminho relativo do projeto antigo; o
  parser foi copiado e colado com ajustes mínimos de import.
- Nenhum remote Git foi criado neste projeto; nenhum `git push` foi
  executado.
