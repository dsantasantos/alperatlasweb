# Feature Specification: Fix UI Bugs — Moviment Table & Modals

**Feature Branch**: `003-fix-moviment-ui-bugs`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "fix: Apos as ultimas melhorias, ficaram os seguinte problemas para correção — (1) coluna checkbox all com visual cinza abaixo do header; (2) coluna tipo sem conteúdo; (3) diário do lote não recarrega automaticamente e está visualmente fora do padrão; (4) área de anotação bagunçada no modal de formulário."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Tabela sem artefatos visuais na coluna de seleção (Priority: P1)

O analista visualiza a tabela de movimentos e a coluna de checkbox (selecionar todos) apresenta uma faixa cinza entre o cabeçalho e a primeira linha de dados, quebrando a consistência visual do layout.

**Why this priority**: Impacto visual imediato para todos os usuários da tela; a coluna de seleção em massa é um controle central do fluxo de aprovação em lote.

**Independent Test**: Abrir a tela de Movimentos, verificar que não há linha cinza ou fundo inesperado separando o header de seleção da primeira linha de dados.

**Acceptance Scenarios**:

1. **Given** a tela Movimentos carregada com registros, **When** o usuário visualiza a coluna de checkbox, **Then** nenhuma linha cinza ou borda extra aparece entre o cabeçalho e a primeira linha de dados.
2. **Given** o modo escuro ou claro ativo, **When** o usuário carrega a tabela, **Then** a coluna de checkbox mantém o mesmo estilo visual das demais colunas sem artefatos de cor.

---

### User Story 2 — Coluna "Tipo" exibe seu conteúdo corretamente (Priority: P1)

O analista vê a coluna "Tipo" na tabela, porém suas células aparecem completamente vazias, mesmo quando o registro possui um valor de tipo definido.

**Why this priority**: Dado crítico para triagem; sem o tipo visível o analista não consegue classificar os registros na grade.

**Independent Test**: Carregar a tabela com registros que possuem campo "tipo" preenchido e verificar que o valor aparece na célula correspondente.

**Acceptance Scenarios**:

1. **Given** registros com campo "tipo" definido no schema/API, **When** a tabela é renderizada, **Then** o valor do tipo é exibido na célula da coluna "Tipo" para cada linha.
2. **Given** um registro sem campo "tipo" definido, **When** a tabela é renderizada, **Then** a célula aparece vazia sem erros e sem quebrar o layout.

---

### User Story 3 — Diário do Lote atualiza em tempo real após alterações (Priority: P2)

O analista realiza uma ação no lote (aprova, rejeita ou edita) e espera que o painel de diário do lote reflita imediatamente a nova entrada, sem precisar recarregar a página inteira.

**Why this priority**: A necessidade de recarregar a página para ver o diário cria fricção no fluxo de auditoria e pode levar o analista a perder o contexto da sessão atual.

**Independent Test**: Realizar uma ação no lote e verificar que o diário é atualizado automaticamente sem navegação ou refresh da página.

**Acceptance Scenarios**:

1. **Given** o painel de diário do lote visível, **When** o analista aprova ou rejeita um item do lote, **Then** o diário do lote reflete a nova entrada em menos de 3 segundos, sem recarregar a página.
2. **Given** múltiplas ações realizadas na mesma sessão, **When** cada ação é concluída, **Then** o diário acumula todas as entradas na ordem cronológica sem perder entradas anteriores.

---

### User Story 4 — Diário do Lote segue o padrão visual da tela Cadastral Moviment (Priority: P2)

O diário do lote está sendo exibido de forma visualmente inconsistente com o restante da tela, incluindo botões ou controles fora do padrão de design estabelecido na tela de referência Cadastral Moviment.

**Why this priority**: Consistência visual é requisito do design system (Princípio II da Constituição); o desvio sinaliza que o componente não consumiu os tokens e variantes corretos.

**Independent Test**: Comparar visualmente o diário do lote com os componentes equivalentes na tela Cadastral Moviment e confirmar que tipografia, espaçamento, cores e forma dos botões são idênticos.

**Acceptance Scenarios**:

1. **Given** o painel de diário do lote visível, **When** o usuário compara com a tela Cadastral Moviment, **Then** tipografia, cores, espaçamento e variantes de botão são idênticos ao padrão estabelecido.
2. **Given** o diário do lote exibe um controle de ação (ex.: botão), **When** renderizado, **Then** o botão usa a variante e o tamanho documentados no design system, sem estilo ad-hoc.

---

### User Story 5 — Área de anotação no modal de formulário segue o padrão Cadastral Moviment (Priority: P2)

No modal que exibe os campos do formulário de um movimento, a seção de anotação está visualmente desestruturada (campos desalinhados, espaçamentos incorretos ou componentes fora do padrão), diferindo do layout da tela Cadastral Moviment usada como referência.

**Why this priority**: O modal é o principal ponto de entrada de dados do analista; layout bagunçado aumenta tempo de tarefa e risco de erro.

**Independent Test**: Abrir o modal de formulário de um movimento e verificar que a seção de anotação é visualmente idêntica à mesma seção na tela Cadastral Moviment (alinhamento, espaçamento, componentes).

**Acceptance Scenarios**:

1. **Given** o modal de formulário aberto, **When** o usuário visualiza a seção de anotação, **Then** o layout (alinhamento, espaçamento, tamanho do campo de texto) é idêntico ao padrão da tela Cadastral Moviment.
2. **Given** o modal em diferentes tamanhos de viewport (desktop e tablet), **When** o usuário abre a seção de anotação, **Then** o layout permanece consistente e sem sobreposição de elementos.

---

### Edge Cases

- O que acontece se a API retornar `tipo: null` — a célula deve exibir vazio sem erro?
- O que acontece se o diário do lote falhar ao buscar dados em tempo real — deve exibir o último estado conhecido com indicador de erro?
- O modal de anotação com texto muito longo deve respeitar o limite de altura com scroll interno ou expandir o modal?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE remover qualquer estilo ou elemento visual que cause a aparência de linha cinza entre o cabeçalho da coluna de checkbox e a primeira linha de dados da tabela.
- **FR-002**: A coluna "Tipo" DEVE exibir o valor correspondente ao campo tipo de cada registro na célula respectiva, lendo o valor do schema/API da mesma forma que as demais colunas dinâmicas.
- **FR-003**: O painel de diário do lote DEVE se atualizar automaticamente (sem recarregar a página) sempre que uma ação for realizada no lote — aprovação, rejeição ou edição.
- **FR-004**: O componente de diário do lote DEVE utilizar exclusivamente os tokens, variantes de botão e espaçamentos do design system, iguais aos usados na tela Cadastral Moviment.
- **FR-005**: A seção de anotação dentro do modal de formulário de movimentos DEVE seguir exatamente o layout, alinhamento e variantes de componentes da tela Cadastral Moviment como referência visual.
- **FR-006**: Nenhuma das correções acima DEVE introduzir regressões nas demais colunas da tabela, no fluxo de aprovação em lote ou nos outros campos do modal de formulário.

### Key Entities

- **Tabela de Movimentos**: Grade principal com colunas dinâmicas por schema; inclui coluna de checkbox de seleção em massa e coluna "Tipo".
- **Diário do Lote**: Painel de auditoria que registra ações realizadas sobre registros do lote; deve atualizar em tempo real.
- **Modal de Formulário de Movimentos**: Modal que exibe os campos de detalhe/edição de um movimento; contém seção de anotação.
- **Tela Cadastral Moviment**: Tela de referência visual para estilo, posicionamento e variantes de componentes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A coluna de checkbox na tabela de movimentos não exibe nenhum artefato visual (linha, fundo cinza ou borda extra) entre o cabeçalho e as linhas de dados — verificável por inspeção visual em 100% dos casos.
- **SC-002**: 100% dos registros com campo "tipo" definido exibem o valor correto na coluna "Tipo" da tabela.
- **SC-003**: O diário do lote reflete novas ações em até 3 segundos após a conclusão da ação, sem interação adicional do usuário (sem refresh).
- **SC-004**: Inspeção visual confirma que o diário do lote e a seção de anotação do modal são visualmente indistinguíveis dos componentes equivalentes na tela Cadastral Moviment (tipografia, cores, espaçamento, variantes de botão).
- **SC-005**: Nenhuma regressão detectada nos demais componentes da tela após aplicação das correções (colunas dinâmicas, fluxo de aprovação em lote, outros campos do modal).

## Assumptions

- A tela Cadastral Moviment é a referência visual canônica e seu código/estilo está estável e disponível como padrão de comparação.
- O campo "tipo" já existe no schema da API e é retornado nos dados; o problema é de renderização, não de ausência de dado.
- O diário do lote já possui um mecanismo de fetch de dados; o problema é que ele não é reativado automaticamente após ações do lote — a correção é acionar esse fetch de forma reativa, não criar um novo fluxo de dados.
- O modal de formulário e o componente de anotação já existem; a correção é de alinhamento com o design system, não de recriação do componente.
- Escopo limitado a correções visuais e de comportamento reativo; nenhuma nova funcionalidade será adicionada nesta entrega.
