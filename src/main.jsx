import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Estrutura, Login, telas } from './componentes'
import { Configuracoes, Dashboard, Movimentacoes, Produtos, Relatorios } from './telas'
import { repositorio } from './estoque'
import './estilo.css'

const chaveSessao = 'smartstock:demo'
const rotaAtual = () => window.location.hash.slice(1)
function paginaAtual(rota) {
  return Object.hasOwn(telas, rota.split('/')[0]) ? rota.split('/')[0] : 'dashboard'
}

function App() {
  const [email, setEmail] = useState(() => sessionStorage.getItem(chaveSessao))
  const [rota, setRota] = useState(rotaAtual)
  const [estoque, setEstoque] = useState(repositorio.carregar)

  useEffect(() => {
    function navegar() {
      setRota(rotaAtual())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', navegar)
    return () => window.removeEventListener('hashchange', navegar)
  }, [])

  function atualizar(proximoEstoque) {
    repositorio.salvar(proximoEstoque)
    setEstoque(proximoEstoque)
  }

  function entrar(emailInformado) {
    sessionStorage.setItem(chaveSessao, emailInformado)
    setEmail(emailInformado)
    window.location.hash = 'dashboard'
  }

  function sair() {
    sessionStorage.removeItem(chaveSessao)
    setEmail(null)
    window.history.replaceState(null, '', window.location.pathname)
    setRota('')
  }

  if (!email) return <Login entrar={entrar} />

  const pagina = paginaAtual(rota)
  const Tela = { dashboard: Dashboard, produtos: Produtos, movimentacoes: Movimentacoes, relatorios: Relatorios, configuracoes: Configuracoes }[pagina]
  return <Estrutura pagina={pagina} perfil={estoque.perfil} sair={sair}>
    <Tela estoque={estoque} atualizar={atualizar} email={email} rota={rota} />
  </Estrutura>
}

createRoot(document.getElementById('root')).render(<App />)
