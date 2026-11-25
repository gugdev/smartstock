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

export const estoqueBaixo = produto => produto.quantidade <= produto.minimo
export const totalUnidades = produtos => produtos.reduce((total, produto) => total + produto.quantidade, 0)
export const somaMovimentos = (movimentos, tipo) => movimentos.reduce(
  (total, movimento) => total + (movimento.tipo === tipo ? movimento.quantidade : 0), 0,
)

export const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const numero = new Intl.NumberFormat('pt-BR')
export const dataBR = data => data.split('-').reverse().join('/')
