# Feature Specification: Upload de Planilha para Inclusão de Lote (XLSX Batch Upload)

**Feature Branch**: `006-xlsx-batch-upload`

**Created**: 2026-06-29

**Status**: Draft

**Input**: Upload de planilha XLSX via endpoint `/api/batches/xlsx` para inclusão de novo lote e ocorrências, acessível a partir da tela `CadastralMovimentDefault` com botão dedicado e modal de formulário.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Abrir Modal de Upload de Lote (Priority: P1)

O analista está na tela `CadastralMovimentDefault` e deseja incluir um novo lote a partir de uma planilha XLSX. Ele localiza o botão "Importar Planilha" posicionado entre o botão "Diário do Lote" e o botão "Exportar", clica nele e o modal de upload é exibido com todos os campos obrigatórios.

**Why this priority**: É o ponto de entrada da funcionalidade; sem o botão e o modal, nenhum upload é possível.

**Independent Test**: Verificado ao navegar para a tela e confirmar que o botão aparece na posição correta e que o clique abre o modal com todos os campos visíveis.

**Acceptance Scenarios**:

1. **Given** o analista está na tela `CadastralMovimentDefault`, **When** ele visualiza a barra de ações, **Then** o botão "Importar Planilha" aparece entre os botões "Diário do Lote" e "Exportar".
2. **Given** o botão "Importar Planilha" está visível, **When** o analista clica nele, **Then** o modal de upload é aberto exibindo os campos: Arquivo (XLSX), Tipo de Operação, Tipo de Movimentação, Tipo de Fonte, ID da Fonte e Canal da Fonte.
3. **Given** o modal está aberto, **When** o analista não preenche nenhum campo, **Then** todos os campos mostram indicador de obrigatório e o botão "Salvar" está disponível para tentativa de envio.

---

### User Story 2 — Preencher e Submeter o Formulário de Upload (Priority: P1)

O analista preenche todos os campos obrigatórios do modal — incluindo a seleção do arquivo XLSX e os metadados do lote — e clica em "Salvar". O sistema envia os dados ao endpoint `POST /api/batches/xlsx` e, após sucesso, fecha o modal e recarrega a listagem de lotes exibindo o novo lote no lado esquerdo da tela.

**Why this priority**: É o fluxo principal de negócio; sem ele a feature não entrega valor.

**Independent Test**: Verificado ao preencher todos os campos, selecionar um XLSX válido e confirmar que após o envio bem-sucedido o novo lote aparece na listagem sem necessidade de recarga manual.

**Acceptance Scenarios**:

1. **Given** todos os campos estão preenchidos e um arquivo XLSX válido foi selecionado, **When** o analista clica em "Salvar", **Then** o sistema envia os dados ao endpoint e exibe indicador de carregamento durante o processamento.
2. **Given** o envio foi processado com sucesso pelo servidor, **When** a resposta de sucesso é recebida, **Then** o modal é fechado automaticamente e a listagem de lotes é recarregada com o novo lote visível na posição mais recente do lado esquerdo.
3. **Given** o modal está aberto com campos preenchidos, **When** o analista clica em "Cancelar" ou fecha o modal, **Then** nenhuma requisição é enviada e o estado da tela permanece inalterado.

---

### User Story 3 — Validação de Campos Obrigatórios e Feedback de Erro (Priority: P2)

O analista tenta submeter o formulário sem preencher um ou mais campos obrigatórios, ou o servidor retorna um erro. O sistema exibe mensagens de validação claras para cada campo inválido sem fechar o modal, permitindo que o analista corrija e reenvie.

**Why this priority**: Garante a integridade dos dados enviados e orienta o analista em caso de falha, mas o fluxo feliz (P1) já entrega valor independentemente.

**Independent Test**: Verificado ao submeter o formulário vazio e confirmar que mensagens de erro aparecem por campo; e ao simular erro do servidor e confirmar que o modal permanece aberto com mensagem de erro.

**Acceptance Scenarios**:

1. **Given** o analista clica em "Salvar" sem preencher todos os campos, **When** a validação é executada, **Then** cada campo obrigatório não preenchido exibe mensagem de erro e o envio não é realizado.
2. **Given** o arquivo selecionado não possui extensão `.xlsx`, **When** o analista tenta anexá-lo, **Then** o sistema rejeita o arquivo e exibe mensagem indicando que apenas arquivos XLSX são aceitos.
3. **Given** todos os campos estão preenchidos e o servidor retorna erro, **When** a resposta de erro é recebida, **Then** o modal permanece aberto, exibe a mensagem de erro retornada pelo servidor e o analista pode tentar novamente.

---

### Edge Cases

- O que acontece quando o arquivo XLSX está corrompido ou vazio?
- Como o sistema se comporta se a conexão cair durante o upload?
- O que ocorre se o analista abrir o modal, fechar e reabrir — os campos devem ser resetados?
- Não há timeout no frontend: o indicador de carregamento permanece ativo até o servidor responder ou a conexão cair (erro de rede tratado como erro do servidor — modal permanece aberto com mensagem de erro).
- Arquivos XLSX maiores que 10 MB são rejeitados com mensagem de erro client-side antes do envio.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A tela `CadastralMovimentDefault` DEVE exibir um botão "Importar Planilha" posicionado entre o botão "Diário do Lote" e o botão "Exportar".
- **FR-002**: O botão "Importar Planilha" DEVE abrir um modal ao ser clicado.
- **FR-003**: O modal DEVE conter os seguintes campos obrigatórios:
  - **Arquivo** — seleção de arquivo binário (`.xlsx`)
  - **Tipo de Operação** (`OperationTypeKey`) — texto livre
  - **Tipo de Movimentação** (`MovementType`) — texto livre
  - **Tipo de Fonte** (`SourceType`) — texto livre
  - **ID da Fonte** (`SourceId`) — texto livre
  - **Canal da Fonte** (`SourceChannel`) — texto livre
- **FR-004**: Todos os campos do modal DEVEM ser marcados como obrigatórios e o sistema NÃO DEVE permitir o envio quando qualquer campo estiver vazio.
- **FR-005**: O modal DEVE aceitar apenas arquivos com extensão `.xlsx` no campo de arquivo e com tamanho máximo de **10 MB**. Arquivos que excedam esse limite DEVEM ser rejeitados com mensagem de erro antes de qualquer envio ao servidor.
- **FR-006**: O modal DEVE conter um botão "Salvar" que submete o formulário ao endpoint `POST /api/batches/xlsx` como `multipart/form-data`.
- **FR-007**: O modal DEVE conter um botão "Cancelar" (ou mecanismo de fechar) que descarta o formulário sem enviar dados.
- **FR-008**: Durante o processamento da requisição, o sistema DEVE exibir um indicador visual de carregamento e desabilitar o botão "Salvar" para evitar submissões duplicadas.
- **FR-009**: Após resposta de sucesso do servidor, o modal DEVE ser fechado automaticamente, a listagem de lotes DEVE ser recarregada, e uma notificação de sucesso (toast) com a mensagem "Lote importado com sucesso" DEVE ser exibida ao analista.
- **FR-010**: O novo lote incluído DEVE aparecer na listagem do lado esquerdo da tela após o recarregamento.
- **FR-011**: Caso o servidor retorne erro, o modal DEVE permanecer aberto e exibir a mensagem de erro de forma clara ao analista.
- **FR-012**: Ao reabrir o modal após fechamento, todos os campos DEVEM estar em estado inicial (limpos).

### Key Entities

- **Lote (Batch)**: Unidade de agrupamento de ocorrências. Identificado por chave de operação, tipo de movimentação, fonte e canal. Criado a partir de uma planilha XLSX.
- **Arquivo XLSX**: Planilha binária que contém as ocorrências a serem importadas. Campo binário enviado como `multipart/form-data`.
- **Metadados do Lote**: Conjunto de campos textuais (`OperationTypeKey`, `MovementType`, `SourceType`, `SourceId`, `SourceChannel`) que classificam e identificam o lote dentro do sistema.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: O analista consegue iniciar um upload de planilha em até 30 segundos a partir de chegar na tela `CadastralMovimentDefault`.
- **SC-002**: 100% dos campos obrigatórios são validados antes do envio — nenhum lote é criado com dados incompletos.
- **SC-003**: Após upload bem-sucedido, o analista recebe uma notificação de sucesso e o novo lote aparece na listagem sem qualquer ação manual adicional (recarga automática + toast).
- **SC-004**: O analista recebe feedback visual de carregamento durante todo o processamento do upload, eliminando dúvida sobre se a ação foi registrada.
- **SC-005**: Em caso de erro do servidor, 100% das mensagens de erro são exibidas ao analista no modal sem perda dos dados preenchidos.
- **SC-006**: O botão "Importar Planilha" é encontrado pelos analistas na posição correta sem necessidade de treinamento adicional (localizado entre "Diário do Lote" e "Exportar").

---

## Clarifications

### Session 2026-06-29

- Q: Qual o limite de tamanho do arquivo XLSX aceito pelo frontend? → A: 10 MB, com validação client-side antes do envio; arquivos maiores são rejeitados com mensagem de erro.
- Q: Deve haver feedback visual de sucesso além do fechamento do modal e reload da lista? → A: Sim, exibir toast com mensagem "Lote importado com sucesso".
- Q: O frontend deve implementar timeout para o upload? → A: Não; o indicador de carregamento permanece até o servidor responder ou a conexão cair; erros de rede são tratados como erros do servidor (modal permanece aberto com mensagem de erro).

---

## Assumptions

- O endpoint `POST /api/batches/xlsx` já está implementado e disponível no backend, aceitando `multipart/form-data` com os seis campos descritos.
- Os campos `OperationTypeKey`, `MovementType`, `SourceType`, `SourceId` e `SourceChannel` são entradas de texto livre; não há listas de valores pré-definidos a serem consultadas (não há endpoints de lookup para esses campos nesta versão).
- A tela `CadastralMovimentDefault` já possui os botões "Diário do Lote" e "Exportar" implementados; o novo botão será inserido entre eles.
- A listagem de lotes no lado esquerdo da tela possui mecanismo de recarregamento que pode ser acionado programaticamente após sucesso do upload.
- O sistema de autenticação já está implementado; o token de autenticação é enviado automaticamente nas requisições.
- Suporte a múltiplos arquivos simultâneos está fora do escopo desta versão — apenas um arquivo por envio.
- Validação de conteúdo do XLSX (estrutura interna, colunas esperadas) é responsabilidade do backend; o frontend valida apenas a extensão do arquivo.
