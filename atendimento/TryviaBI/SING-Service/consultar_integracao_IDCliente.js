// Função para consultar integrações por ID Cliente
async function consultarIntegracoesPorIdCliente(idCliente) {
  try {
    const token = await obterToken();
   

    if (!token) throw new Error("Token não obtido!");

    const response = await fetch(`https://singservices.newsgps.com.br/api/SingServices/GetIntegracao?idCliente=${idCliente}`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("📦 Retorno API integrações:", result);

    // Verifica se retorno é array
    if (!Array.isArray(result)) {
      throw new Error("Formato inesperado da resposta.");
    }

    return {
      sucesso: true,
      cliente: {
        nome: result[0]?.cliente || null,
        id_cliente: idCliente
      },
      integracoes: result.map(item => ({
        sistema: item.sistema,
        entidade: item.entidade,
        dataUltimaIntegracao: item.ultimaIntegracao,
        status: item.erro ? 'Erro' : 'Ativo',
        erro: item.erro || false
      })),
      total_integracoes: result.length,
      observacao: null
    };

  } catch (error) {
    console.error('⚠️ Erro na consulta de integrações por ID Cliente:', error);

    // Retorno de fallback (demonstração)
    const integracoesDemo = [
      {
        sistema: "Sistema Demo 1",
        entidade: "Entidade Demo 1",
        dataUltimaIntegracao: new Date().toISOString(),
        status: "Ativo"
      },
      {
        sistema: "Sistema Demo 2",
        entidade: "Entidade Demo 2",
        dataUltimaIntegracao: new Date(Date.now() - 86400000).toISOString(),
        status: "Ativo"
      }
    ];

    return {
      sucesso: false,
      cliente: null,
      integracoes: integracoesDemo,
      total_integracoes: integracoesDemo.length,
      observacao: "Dados de demonstração - API externa indisponível"
    };
  }
}