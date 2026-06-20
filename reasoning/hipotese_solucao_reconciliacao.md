# Hipótese de Solução — Agente de Reconciliação de Dados

## Contexto e Motivação

Organizações que operam com múltiplas fontes de dados cadastrais convivem diariamente com um problema silencioso: os mesmos dados existem em lugares diferentes, chegam em formatos diferentes, foram digitados por pessoas diferentes e seguem convenções diferentes. O resultado é uma massa de inconsistências que ninguém consegue rastrear de forma sistemática, e cujo impacto só aparece quando já causou algum dano — um beneficiário com plano errado, um nome divergente entre a operadora e o cliente, uma data de nascimento em formato incompatível que impede a conciliação automática.

A tentação natural é resolver isso com regras. Escrever um script que normaliza datas, outro que compara nomes, outro que trata abreviações. Essa abordagem funciona enquanto o mundo é previsível, mas quebra na primeira variação não mapeada. O problema não é técnico — é semântico. "MC" e "MC Donalds" são a mesma empresa. "C. Lucia" e "Carmem Lucia" são a mesma pessoa. "Brasil - RJ" e "Rio de Janeiro" são o mesmo lugar. Nenhuma regra determinística consegue cobrir a infinidade de formas com que humanos representam a mesma informação.

A hipótese desta solução é que um agente de inteligência artificial, quando usado de forma cirúrgica e estruturada, consegue resolver exatamente essa camada semântica — sem abrir mão do rigor determinístico onde ele é possível e mais eficiente. O agente não substitui as regras; ele atua onde as regras falham.


## A Hipótese Central

A hipótese é que o problema de reconciliação de dados heterogêneos pode ser decomposto em três perguntas distintas, cada uma com uma natureza diferente e, portanto, com uma estratégia de resolução diferente.

A primeira pergunta é estrutural: quais colunas de uma fonte correspondem a quais colunas da outra? Essa pergunta pode ser respondida por configuração declarativa quando alguém já sabe a resposta, e por inferência semântica de um modelo de linguagem quando não existe mapeamento declarado. O resultado desta etapa é um dicionário de equivalências entre os dois esquemas.

A segunda pergunta é de identidade: dada uma linha da Fonte A e uma linha da Fonte B, essas duas linhas representam o mesmo indivíduo ou entidade no mundo real? Essa pergunta é fundamentalmente semântica e não pode ser respondida por algoritmos determinísticos de forma confiável, especialmente quando os campos mais óbvios de identificação — como o nome — estão ausentes, truncados ou abreviados. É aqui que o modelo de linguagem atua como motor principal, avaliando o conjunto de campos disponíveis de forma holística para inferir a probabilidade de correspondência.

A terceira pergunta é de consistência: para um par já identificado, os valores de cada campo conferem entre as duas fontes? Essa pergunta é majoritariamente técnica — comparar datas requer normalização de formato, comparar cidades requer expansão de abreviações, comparar valores numéricos requer padronização de unidades. O modelo de linguagem entra apenas nos casos em que a comparação exige julgamento semântico que vai além da normalização algorítmica.

A separação dessas três perguntas é o fundamento arquitetural da solução. Misturá-las em uma única chamada ao modelo resultaria em um sistema opaco, caro, difícil de auditar e frágil diante de variações nos dados.


## As Camadas da Solução

### Camada de Configuração e Mapeamento de Esquema

A primeira camada é responsável por alinhar os esquemas das duas fontes antes que qualquer dado seja comparado. Ela opera a partir de um arquivo de configuração declarativo, no qual um operador humano pode registrar explicitamente que a coluna "header3" de uma fonte corresponde à coluna "Data Nascimento" da outra, ou que a coluna "Nation/City" equivale a "Cidade". Esses mapeamentos declarados têm confiança máxima e não são revisitados pelo modelo.

Quando não existe mapeamento declarado para uma coluna, o modelo de linguagem é acionado para inferir a correspondência com base nos nomes das colunas, nos valores de exemplo e no contexto geral do conjunto de dados. O resultado dessa inferência é persistido na base de conhecimento com o score de confiança atribuído pelo modelo, aguardando validação humana. Uma vez validado, o mapeamento deixa de ser inferido e passa a ser tratado como declarativo nas execuções seguintes.

Essa camada é executada uma única vez por configuração de fonte, ou quando ocorre uma mudança estrutural nos dados de entrada. Ela não é reexecutada a cada rodada de reconciliação, o que a torna eficiente e previsível em custo.

### Camada de Identificação de Pares

A segunda camada recebe os registros já com esquemas alinhados e tem como único objetivo determinar quais linhas de uma fonte correspondem a quais linhas da outra. É nesta camada que reside a maior complexidade semântica do problema.

O modelo de linguagem recebe os registros de ambas as fontes e é instruído a identificar pares com base no conjunto completo de campos disponíveis, sem depender de nenhum campo âncora fixo. Isso é fundamental porque, como demonstrado nos dados de exemplo, o campo que parece mais óbvio para identificação — o nome do beneficiário — pode estar ausente, abreviado ou descrito de forma completamente diferente em uma das fontes. No caso em que o nome consta como "Não informada" em uma fonte, mas empresa, plano, data de nascimento e cidade convergem para o mesmo indivíduo, o modelo consegue estabelecer o par com alta confiança a partir dos campos secundários.

O output desta camada é uma lista de pares, onde cada par registra a linha da Fonte A, a linha da Fonte B, o score de confiança do match, quais campos foram determinantes para a identificação e quais campos estavam ausentes ou inconclusivos. Registros que não encontram correspondência em nenhuma das fontes são isolados em uma categoria própria, distintos dos registros com correspondência mas dados divergentes — pois são inconsistências de naturezas fundamentalmente diferentes.

### Camada de Scoring por Campo

A terceira camada opera sobre os pares já identificados e compara os valores de cada campo correspondente, gerando um score individual e uma classificação de severidade para cada divergência encontrada.

A comparação é realizada primariamente por regras determinísticas. Datas em formatos diferentes são normalizadas antes da comparação — "01/09/2005", "2005/09/01" e "1/9/2005" representam o mesmo dia e devem ser tratadas como equivalentes. Abreviações geográficas conhecidas são expandidas — "SP" equivale a "São Paulo". Valores ausentes explícitos, como "Não informada", recebem tratamento diferenciado do valor simplesmente vazio.

Nos casos em que a comparação exige julgamento semântico — como avaliar se "Amil 1" e "Amil" representam o mesmo produto, ou se "Bradesco TOP" e "Br TOP" são abreviações do mesmo plano — o modelo de linguagem é acionado pontualmente, recebendo apenas os dois valores em questão e o contexto do campo, sem necessidade de processar o registro inteiro novamente.

O resultado de cada campo recebe uma classificação entre três estados: equivalente, quando os valores representam a mesma informação independente do formato; divergente com ressalva, quando há correspondência parcial ou ambiguidade que requer revisão humana; e divergente, quando os valores são claramente incompatíveis. O score geral do par é calculado como uma composição ponderada dos scores individuais de cada campo.

### Camada de Base de Conhecimento

Toda resolução produzida pelo agente — seja um mapeamento de esquema inferido, um par identificado ou uma comparação de campo julgada pelo modelo — é persistida em uma base de conhecimento auditável. Cada registro desta base contém o contexto da decisão, o score atribuído, os campos que sustentaram o julgamento e um indicador de validação humana.

Essa base cumpre dois papéis. O primeiro é a auditabilidade: qualquer inconsistência reportada pode ser rastreada até a decisão que a originou, com todos os dados que a fundamentaram. O segundo é o aprendizado acumulado: nas execuções seguintes, o modelo recebe como contexto os casos já resolvidos, o que melhora progressivamente a qualidade das inferências e reduz a necessidade de julgamentos repetidos para padrões já conhecidos. Se "MC" foi identificado como "MC Donalds" em uma execução anterior e essa identificação foi validada, essa informação estará disponível como referência nas próximas rodadas.

### Camada de Output

O resultado final de cada execução é um relatório estruturado que detalha, para cada par identificado, os campos com divergência, a natureza da divergência, a fonte onde o ajuste deve ser realizado e o score geral de consistência do par. Registros sem correspondência são listados separadamente, com indicação de qual fonte não os contém.

O relatório não toma decisões. Ele pontua. A decisão de qual inconsistência corrigir, em qual fonte e em qual ordem é sempre do operador humano. O papel do agente é transformar uma massa amorfa de dados heterogêneos em uma lista precisa e priorizada de ajustes necessários, com evidências suficientes para que o operador possa agir com confiança.


## O que se Espera desta Solução

Espera-se que esta solução seja capaz de receber dois conjuntos de dados tabulares com estruturas arbitrárias — diferentes ordens de colunas, diferentes nomenclaturas, diferentes formatos de valores — e produzir como saída uma lista precisa das inconsistências existentes entre eles, identificando em qual campo, em qual registro e em qual fonte cada ajuste deve ser feito.

Espera-se que a solução lide naturalmente com a ausência de dados, distinguindo entre um campo que não foi informado e um registro que não existe na outra fonte, e reportando cada situação com a classificação e a severidade adequadas.

Espera-se que a solução seja resiliente a variações de formato que não alteram o significado — datas em ordens diferentes, abreviações de estados, nomes truncados, sufixos numéricos em planos de saúde — sem que essas variações gerem falsos positivos no relatório de inconsistências.

Espera-se que a solução permita que um operador declare explicitamente as equivalências entre colunas quando as conhece, e que o sistema respeite essas declarações como verdade absoluta, usando inferência apenas onde não há configuração disponível.

Espera-se que cada decisão tomada pelo agente seja rastreável, auditável e retroalimentada nas execuções seguintes, de modo que o sistema melhore com o uso sem exigir reconfiguração ou manutenção contínua.

E, fundamentalmente, espera-se que esta solução não seja frágil diante de mudanças. Quando uma nova fonte chega com um novo formato, a camada de configuração absorve a novidade. Quando um padrão novo de abreviação aparece, o modelo infere a equivalência. Quando uma regra nova de negócio precisa ser aplicada, ela é declarada na configuração sem que o restante do sistema precise ser alterado. A manutenibilidade não é uma consequência da solução — é um requisito de design que atravessa todas as suas camadas.
