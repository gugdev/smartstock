import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Estrutura, Login, telas } from './componentes'
import { Configuracoes, Dashboard, Movimentacoes, Produtos, Relatorios } from './telas'
import { StockAI } from './stockai'
import { api } from './api'
import './estilo.css'

const chaveSessao = 'smartstock:demo'
const rotaAtual = () => window.location.hash.slice(1)
function paginaAtual(rota) {
  return Object.hasOwn(telas, rota.split('/')[0]) ? rota.split('/')[0] : 'dashboard'
}

function App() {
  const [email, setEmail] = useState(() => sessionStorage.getItem(chaveSessao))
  const [rota, setRota] = useState(rotaAtual)
  const [estoque, setEstoque] = useState(null)
  const [erro, setErro] = useState('')
  const [pendente, setPendente] = useState(false)
  const operacaoEmAndamento = useRef(false)

  async function carregar() {
    setErro('')
    try { setEstoque(await api.carregar()) }
    catch (falha) { setErro(falha.message) }
  }
  useEffect(() => { if (email) carregar() }, [email])

  useEffect(() => {
    function navegar() {
      setRota(rotaAtual())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', navegar)
    return () => window.removeEventListener('hashchange', navegar)
  }, [])

  async function atualizar(operacao) {
    if (operacaoEmAndamento.current) throw new Error('Aguarde a operação em andamento.')
    operacaoEmAndamento.current = true
    setPendente(true)
    try {
      await operacao()
      // Só exibe o sucesso após buscar os valores confirmados pelo PostgreSQL.
      try { setEstoque(await api.carregar()); setErro('') }
      catch { setErro('A operação foi salva, mas não foi possível atualizar a tela. Clique em Atualizar dados antes de continuar.') }
    } finally { operacaoEmAndamento.current = false; setPendente(false) }
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

  if (!estoque) return <main className="estado-api card" role="status"><h1>SmartStock</h1><p className={erro ? 'erro' : 'muted'}>{erro || 'Carregando estoque do PostgreSQL…'}</p>{erro && <button className="primario" onClick={carregar}>Tentar novamente</button>}</main>

  const pagina = paginaAtual(rota)
  const Tela = { dashboard: Dashboard, produtos: Produtos, movimentacoes: Movimentacoes, relatorios: Relatorios, stockai: StockAI, configuracoes: Configuracoes }[pagina]
  return <Estrutura pagina={pagina} perfil={estoque.perfil} sair={sair}>
    {erro && <div className="erro" role="alert">{erro} <button className="secundario" onClick={carregar}>Atualizar dados</button></div>}
    <fieldset className="operacao-api" disabled={pendente || Boolean(erro)} aria-busy={pendente}>
      <Tela estoque={estoque} atualizar={atualizar} email={email} rota={rota} />
    </fieldset>
  </Estrutura>
}

createRoot(document.getElementById('root')).render(<App />)
