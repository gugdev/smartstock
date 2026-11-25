async function requisitar(caminho, { metodo = 'GET', dados } = {}) {
  let resposta
  try {
    resposta = await fetch(`/api${caminho}`, { method: metodo,
      headers: dados ? { 'Content-Type': 'application/json' } : undefined,
      body: dados ? JSON.stringify(dados) : undefined,
    })
  } catch { throw new Error('Não foi possível conectar à API. Confira se o servidor está ligado.') }
  let conteudo
  try { conteudo = await resposta.json() }
  catch { throw new Error('A API não respondeu corretamente. Confira se o servidor está ligado.') }
  if (!resposta.ok) throw new Error(conteudo.detalhes?.length
    ? `${conteudo.erro} ${conteudo.detalhes.map(item => item.campo).join(', ')}.` : conteudo.erro || 'Não foi possível concluir a operação.')
  return conteudo
}

export const api = {
  carregar: () => requisitar('/estoque'),
  dashboard: () => requisitar('/dashboard'),
  criarProduto: dados => requisitar('/produtos', { metodo: 'POST', dados }),
  editarProduto: (id, dados) => requisitar(`/produtos/${id}`, { metodo: 'PUT', dados }),
  alterarStatus: produto => requisitar(`/produtos/${produto.id}${produto.ativo ? '' : '/reativar'}`, { metodo: produto.ativo ? 'DELETE' : 'PATCH' }),
  registrarMovimento: dados => requisitar('/movimentacoes', { metodo: 'POST', dados }),
  salvarPerfil: dados => requisitar('/perfil', { metodo: 'PUT', dados }),
}
