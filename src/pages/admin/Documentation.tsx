export default function Documentation() {
  return (
    <div className="bg-gray-50 text-gray-900 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif", height: '100%', overflowY: 'auto' }}>
      <style>{`
        .doc-gradient { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); }
        .doc-card     { transition: transform 0.2s; }
        .doc-card:hover { transform: translateY(-5px); }
      `}</style>

      {/* Hero */}
      <header className="doc-gradient text-white py-12 px-6 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Alper Atlas</h1>
          <p className="text-xl opacity-90">Plataforma de tradução de qualquer fonte para conferência humana e envio para operadoras / seguradoras.</p>
          <div className="mt-6 inline-block bg-white text-blue-800 px-4 py-1 rounded-full text-sm font-semibold uppercase tracking-wider">
            Visão Executiva v1.0
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* Sumário Executivo */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b-2 border-blue-100 pb-2">O Desafio e a Solução</h2>
          <div className="md:grid-cols-2 gap-8" style={{ display: 'grid' }}>
            <div>
              <p className="mb-4 text-gray-700">
                O serviço essencial de uma corretora é garantir que a realidade do cliente chegue ao destino (operadoras/seguradoras) de forma <strong>correta, no prazo e auditável</strong>.
              </p>
              <p className="text-gray-700">
                Atualmente, esse processo é artesanal e dependente de planilhas heterogêneas. O <strong>Alper Atlas</strong> transforma esse trabalho em um produto escalável, atuando como um motor genérico de tradução para avaliação humana via cockpit.
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-3">O Modelo N+M</h3>
              <p className="text-sm text-blue-900">
                Ao introduzir um <strong>Contrato Canônico</strong>, reduzimos a complexidade de integrações diretas (N clientes x M destinos) para uma arquitetura linear (N+M). Cada novo cliente ou destino torna-se apenas uma nova "peça" no ecossistema, sem reescrever o sistema.
              </p>
            </div>
          </div>
        </section>

        {/* Ecossistema */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-blue-900 mb-8 border-b-2 border-blue-100 pb-2">O Ecossistema de 4 Componentes</h2>
          <div className="md:grid-cols-2 lg:grid-cols-4 gap-6" style={{ display: 'grid' }}>

            <div className="doc-card bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-blue-600 font-bold text-lg mb-2">Alper Tools</div>
              <p className="text-sm text-gray-600 mb-4 italic">"De onde vem o dado e como o traduzo?"</p>
              <p className="text-xs text-gray-700">Responsável pela <strong>captura e normalização</strong>. Adquire os dados nas fontes e os carimba com a proveniência original.</p>
            </div>

            <div className="doc-card bg-blue-600 p-6 rounded-xl shadow-md border border-blue-700 text-white">
              <div className="font-bold text-lg mb-2">Alper Atlas</div>
              <p className="text-sm opacity-90 mb-4 italic">"Esse dado é íntegro e o evento é válido?"</p>
              <p className="text-xs">O <strong>foco atual</strong>. Motor de decisão e conferência (Cockpit). Onde o analista valida, edita e aprova as movimentações.</p>
            </div>

            <div className="doc-card bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-blue-600 font-bold text-lg mb-2">Alper Core</div>
              <p className="text-sm text-gray-600 mb-4 italic">"Qual é a verdade atual do vínculo?"</p>
              <p className="text-xs text-gray-700">O domínio do <strong>estado</strong>. Mantém o histórico de quem está ativo e em qual plano. O Atlas consulta o Core para validar eventos.</p>
            </div>

            <div className="doc-card bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-blue-600 font-bold text-lg mb-2">Bate Cadastral</div>
              <p className="text-sm text-gray-600 mb-4 italic">"As fontes concordam entre si?"</p>
              <p className="text-xs text-gray-700">Ferramenta de <strong>reconciliação</strong> entre diferentes fontes de dados para garantir a integridade total do ecossistema.</p>
            </div>

          </div>
        </section>

        {/* Diferenciais */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b-2 border-blue-100 pb-2">Diferenciais Estratégicos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-4 border-b font-bold text-blue-900">Pilar</th>
                  <th className="p-4 border-b font-bold text-blue-900">Descrição Executiva</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-4 border-b font-semibold text-blue-700">Motor Genérico</td>
                  <td className="p-4 border-b text-gray-700">Não é apenas para movimentação cadastral. O Atlas é projetado para suportar faturamento, reembolso e outros cockpits futuros.</td>
                </tr>
                <tr>
                  <td className="p-4 border-b font-semibold text-blue-700">Proveniência</td>
                  <td className="p-4 border-b text-gray-700">Rastreabilidade total. O analista vê o dado canônico, mas pode auditar exatamente de qual coluna e linha do arquivo do cliente o dado veio.</td>
                </tr>
                <tr>
                  <td className="p-4 border-b font-semibold text-blue-700">Evento vs Estado</td>
                  <td className="p-4 border-b text-gray-700">O Atlas cuida do fluxo (evento transacional), enquanto o Core cuida da permanência (vínculo do beneficiário).</td>
                </tr>
                <tr>
                  <td className="p-4 border-b font-semibold text-blue-700">Auditoria Nativa</td>
                  <td className="p-4 border-b text-gray-700">Toda alteração gera um rastro estruturado. Soft-delete (desabilitação) garante que nenhum dado seja perdido.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Impacto */}
        <section>
          <h2 className="text-2xl font-bold text-blue-900 mb-6 border-b-2 border-blue-100 pb-2">Impacto no Negócio</h2>
          <div className="md:grid-cols-3 gap-6 text-center" style={{ display: 'grid' }}>
            <div className="p-6 bg-green-50 rounded-xl border border-green-100">
              <div className="text-green-700 font-bold text-xl mb-1">Qualidade</div>
              <p className="text-sm text-green-900">Redução drástica de recusas por dados inconsistentes.</p>
            </div>
            <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
              <div className="text-blue-700 font-bold text-xl mb-1">Escala</div>
              <p className="text-sm text-blue-900">Crescimento da carteira sem aumento proporcional da equipe.</p>
            </div>
            <div className="p-6 bg-purple-50 rounded-xl border border-purple-100">
              <div className="text-purple-700 font-bold text-xl mb-1">Continuidade</div>
              <p className="text-sm text-purple-900">Fim da dependência de conhecimento tácito dos analistas.</p>
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 px-6 text-center text-sm">
        <p>&copy; 2026 Alper Seguros. Uso Interno - Confidencial.</p>
      </footer>
    </div>
  );
}
