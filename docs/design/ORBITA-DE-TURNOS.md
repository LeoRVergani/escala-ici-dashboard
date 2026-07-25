# Direção de design — Escala ICI

## Três abordagens consideradas

### 1. Órbita de Turnos

**Very Brief Intro:** Um painel operacional escuro, calmo e preciso, inspirado em centros de controle contemporâneos. A agenda é tratada como uma sequência visível de decisões, com superfícies em camadas e cor reservada para turno, risco e publicação.

**Probability:** 0.027

### 2. Papel Executivo

**Very Brief Intro:** Uma linguagem editorial clara, com fundo marfim, tipografia de relatório e faixas cromáticas que organizam equipes e períodos. O produto parece um caderno de operações digital, mais próximo de um documento corporativo do que de um painel técnico.

**Probability:** 0.006

### 3. Sinal Modular

**Very Brief Intro:** Uma direção neo-brutalista corporativa, construída com blocos planos, títulos compactos e indicadores de grande contraste. A interface enfatiza ação e estado sem recorrer a brilhos ou ornamentos tecnológicos.

**Probability:** 0.081

---

## Abordagem escolhida: Órbita de Turnos

### Design Movement

**Swiss International Style aplicado a um centro de operações contemporâneo.** A precisão editorial suíça orienta a tipografia, a hierarquia e os alinhamentos; a profundidade controlada de um centro de operações dá contexto às superfícies, aos estados e ao fluxo de publicação.

### Core Principles

1. **Próxima decisão sempre visível:** cada tela apresenta uma ação principal inequívoca e um caminho de saída claro.
2. **Contexto antes do comando:** área, equipe, período e estado aparecem antes de qualquer ação irreversível.
3. **Densidade progressiva:** a interface começa simples e revela ferramentas somente dentro da tarefa que as exige.
4. **Cor com significado:** azul conduz, verde confirma, amarelo alerta, vermelho impede e as cores dos turnos nunca são decorativas.

### Color Philosophy

O azul-marinho profundo reduz ruído e cria continuidade com o aplicativo Escala ICI. Superfícies mais claras indicam elevação funcional, não decoração. O azul principal marca navegação e ação; o verde é reservado para validação e publicação concluída. Violeta, amarelo, laranja e azul de turno aparecem em pequenas áreas de alta informação. Gradientes são discretos e limitados ao login, ao progresso e à confirmação.

### Layout Paradigm

O produto usa uma **espinha operacional lateral curta** em telas autenticadas, combinada com uma área de trabalho fluida. A tela inicial dispensa sidebar e organiza equipes em uma composição assimétrica: resumo de contexto à esquerda e cartões de destino à direita. Nos fluxos de importação e publicação, uma faixa horizontal de três etapas substitui o wizard de oito passos. A revisão ocupa a largura máxima, com ferramentas compactas acima da grade e um inspetor contextual à direita somente quando necessário.

### Signature Elements

1. **Linha de pulso:** uma linha azul fina que conecta as três etapas e reage ao progresso.
2. **Selo de destino:** cápsula estrutural sempre visível com `COSI / SOC`, período e tipo de escala.
3. **Trilho de turno:** pequenos segmentos coloridos que representam a composição da escala sem competir com o conteúdo.

### Interaction Philosophy

Interações frequentes são imediatas e discretas; decisões raras recebem mais contexto. Cards elevam levemente no hover, menus abrem a partir do ponto de origem e modais preservam visualmente equipe e período. A interface nunca obriga o gestor a interpretar botões desabilitados: a ação aparece somente quando é válida ou vem acompanhada de uma explicação útil.

### Animation

Entradas de páginas usam opacidade e deslocamento vertical de 8 px em 180–240 ms. Cards entram em cascata com intervalos de 45 ms. Botões respondem ao toque em 120–160 ms com escala de 0,97. Modal e painel lateral usam opacidade e escala inicial de 0,96, sem animações expansivas. A barra de progresso preenche em 220 ms. Todas as animações respeitam `prefers-reduced-motion` e nenhum feedback crítico depende exclusivamente de movimento.

### Typography System

**Sora** é usada em títulos, números operacionais e CTAs; seus desenhos geométricos reforçam clareza e decisão. **IBM Plex Sans** é usada em texto, tabelas e controles por sua legibilidade em alta densidade. A hierarquia parte de 12 px em metadados, 14–16 px em controles e texto, 24–32 px em títulos de tarefa e 44–56 px no login. Números de período e contagens usam alinhamento tabular.

### Brand Essence

**Posicionamento:** o centro de decisão para gestores que precisam publicar escalas corretas, na equipe certa e sem depender de conhecimento técnico.

**Personalidade:** precisa, serena, responsável.

### Brand Voice

Títulos descrevem a tarefa em linguagem direta; CTAs usam verbo + objeto; microcopy antecipa consequência e saída. O tom é corporativo, humano e sem termos de infraestrutura.

**Exemplos:**

- `Sua escala está pronta para ser conferida.`
- `Publicar para SOC — período de 26 jul. a 25 ago.`

### Wordmark & Logo

O símbolo combina **três turnos escalonados** em uma órbita aberta, formando discretamente a letra `E` e um movimento ascendente. O wordmark usa `Escala` em Sora semibold e `ICI` como um pequeno selo de sistema. O ícone deve funcionar sozinho no cabeçalho e no favicon, sem texto e sobre fundo transparente.

### Signature Brand Color

**Azul Órbita — `#3B82F6`**. É a cor proprietária da ação segura: caminho ativo, foco, seleção e avanço.

---

## Arquitetura do protótipo

### Mapa simplificado de navegação

`Entrada` → `Minhas equipes` → `Equipe SOC` → `Importar XLS` → `Revisar escala` → `Conferir publicação` → `Confirmação` → `Publicação concluída`

Rotas secundárias autenticadas: `Escalas`, `Solicitações de troca`, `Histórico` e `Administração` (restrita). Ferramentas de desenvolvimento e diagnóstico técnico não participam do fluxo principal.

### Estados demonstrados

| Estado | Demonstração no protótipo |
| --- | --- |
| Carregamento | Skeleton da seleção de equipes e leitura do XLS |
| Vazio | Equipe sem escala preparada para o próximo período |
| Aviso | Dois avisos não impeditivos na revisão |
| Erro | Possível arquivo de outra equipe e publicação bloqueada |
| Sucesso | Validação aprovada e publicação concluída |

### Modelo conceitual

| Entidade | Campos relevantes |
| --- | --- |
| Gestor | nome, áreas autorizadas, equipes autorizadas, perfil |
| Área | nome, equipes |
| Equipe | nome, modelo, período atual, última publicação, status |
| Escala | equipe, período, colaboradores, dias, turnos, alterações, alertas, estado |
| Publicação | escala, gestor, data/hora, status de sincronização, versão histórica |
| Troca | solicitante, outro técnico, datas, turnos, status, decisão do gestor |

### Critérios de fidelidade

O protótipo utiliza conteúdo realista em português para Claudio, COSI e SOC; mantém SOC e NOC como destinos independentes; preserva a grade, o Planejador, a edição em lote, o histórico e a exportação; não apresenta Firebase, workspace, dry-run, flags ou nomes internos ao gestor; e prioriza a prevenção de publicação para a equipe errada.

## Style Decisions

- As telas autenticadas mantêm uma espinha operacional curta e um selo de contexto persistente com área, equipe e período antes das ações principais.
- Linha de pulso, selo de destino e trilho de turnos formam a gramática visual recorrente do fluxo; ao menos um deles aparece com destaque em cada tela principal.
- Gradientes ficam restritos à entrada, ao progresso e à confirmação. As demais superfícies usam elevação plana em marinho, com cor reservada para ação, validação, aviso, bloqueio e informação de turno.
- Cards operacionais adotam raios menores, alinhamentos mais rígidos e números tabulares para aproximar a interface de um sistema suíço de operação, não de um dashboard SaaS genérico.
