const chave = 'smartstock:estoque:v1'

export function dataLocal(data = new Date()) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function dataAnterior(dias) {
  const data = new Date()
  data.setDate(data.getDate() - dias)
  return dataLocal(data)
}

const produtosIniciais = [
  { id: '1', nome: 'Papel A4', categoria: 'Papelaria', quantidade: 2, minimo: 10, preco: 28.90 },
  { id: '2', nome: 'Toner impressora', categoria: 'Informática', quantidade: 1, minimo: 5, preco: 189.90 },
  { id: '3', nome: 'Caneta azul', categoria: 'Papelaria', quantidade: 120, minimo: 20, preco: 2.50 },
  { id: '4', nome: 'Mouse USB', categoria: 'Informática', quantidade: 35, minimo: 8, preco: 39.90 },
  { id: '5', nome: 'Caderno 10 matérias', categoria: 'Papelaria', quantidade: 14, minimo: 10, preco: 22 },
  { id: '6', nome: 'Teclado USB', categoria: 'Informática', quantidade: 9, minimo: 5, preco: 59.90 },
]

function demonstracao() {
  return {
    produtos: produtosIniciais.map(produto => ({ ...produto, ativo: true })),
    movimentos: [
      { id: 'm1', produtoId: '1', produtoNome: 'Papel A4', tipo: 'saida', quantidade: 8, data: dataAnterior(0), observacao: 'Uso interno', responsavel: 'Equipe demo' },
      { id: 'm2', produtoId: '3', produtoNome: 'Caneta azul', tipo: 'entrada', quantidade: 100, data: dataAnterior(1), observacao: 'Reposição', responsavel: 'Equipe demo' },
      { id: 'm3', produtoId: '2', produtoNome: 'Toner impressora', tipo: 'saida', quantidade: 2, data: dataAnterior(2), observacao: 'Impressora do escritório', responsavel: 'Equipe demo' },
      { id: 'm4', produtoId: '1', produtoNome: 'Papel A4', tipo: 'entrada', quantidade: 10, data: dataAnterior(3), observacao: '', responsavel: 'Equipe demo' },
      { id: 'm5', produtoId: '4', produtoNome: 'Mouse USB', tipo: 'entrada', quantidade: 25, data: dataAnterior(5), observacao: '', responsavel: 'Equipe demo' },
    ],
    perfil: { nome: 'Operador demo', alertas: true },
  }
}

// A tela consome esta interface. Na Aula 8, a API assume a persistência.
export const repositorio = {
  carregar() {
    const salvo = localStorage.getItem(chave)
    return salvo ? JSON.parse(salvo) : demonstracao()
  },
  salvar(estoque) {
    localStorage.setItem(chave, JSON.stringify(estoque))
  },
}

export const estoqueBaixo = produto => produto.quantidade <= produto.minimo
export const totalUnidades = produtos => produtos.reduce((total, produto) => total + produto.quantidade, 0)
export const somaMovimentos = (movimentos, tipo) => movimentos.reduce(
  (total, movimento) => total + (movimento.tipo === tipo ? movimento.quantidade : 0), 0,
)

export function registrarMovimento(estoque, dados) {
  const produto = estoque.produtos.find(item => item.id === dados.produtoId && item.ativo)
  if (!produto) throw new Error('Selecione um produto ativo.')
  if (!Number.isSafeInteger(dados.quantidade) || dados.quantidade <= 0) {
    throw new Error('Informe uma quantidade inteira maior que zero.')
  }

  const saldo = dados.tipo === 'entrada'
    ? produto.quantidade + dados.quantidade
    : produto.quantidade - dados.quantidade

  if (saldo < 0) throw new Error(`Saldo insuficiente. Disponível: ${produto.quantidade} un.`)
  if (!Number.isSafeInteger(saldo)) throw new Error('A quantidade excede o limite suportado.')

  return {
    ...estoque,
    produtos: estoque.produtos.map(item => item.id === produto.id ? { ...item, quantidade: saldo } : item),
    movimentos: [
      { ...dados, id: crypto.randomUUID(), produtoNome: produto.nome, responsavel: estoque.perfil.nome },
      ...estoque.movimentos,
    ],
  }
}

export const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const numero = new Intl.NumberFormat('pt-BR')
export const dataBR = data => data.split('-').reverse().join('/')
