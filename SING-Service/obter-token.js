// Função para obter o Bearer Token
async function obterToken() {
  try {
    const response = await fetch('https://singservices.newsgps.com.br/api/OAuth/Login', {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user: 'integracaoportal',
        password: 'cadeadoNG1'
      })
    });

    if (!response.ok) {
      throw new Error(`Falha ao obter token: ${response.status}`);
    }

    // A API retorna o token
    const token = await response.text();


    return token; // retorna diretamente o token correto

  } catch (erro) {
    console.error("❌ Erro ao obter token:", erro);
    return null;
  }
}