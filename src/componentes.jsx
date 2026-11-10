import { ArrowDownLeft, ArrowUpRight, Boxes, ChartNoAxesCombined, ClipboardList, LayoutDashboard, LogOut, Settings, Package, Menu, X, Eye, EyeOff, ShieldCheck, ArrowRight, Mail, LockKeyhole, CircleAlert, Bot } from 'lucide-react'
import { useState } from 'react'
import { dataBR, numero, somaMovimentos } from './estoque'

export const telas = {
  dashboard: { nome: 'Dashboard', titulo: 'Dashboard', resumo: 'Acompanhe os principais indicadores do seu estoque', icone: LayoutDashboard },
  produtos: { nome: 'Produtos', titulo: 'Gestão de Produtos', resumo: 'Cadastre, consulte e atualize os itens do seu estoque', icone: Package },
  movimentacoes: { nome: 'Movimentações', titulo: 'Movimentação de Estoque', resumo: 'Registre entradas e saídas com rastreabilidade', icone: ClipboardList },
  relatorios: { nome: 'Relatórios', titulo: 'Relatórios', resumo: 'Analise o histórico e acompanhe o comportamento do estoque', icone: ChartNoAxesCombined },
  stockai: { nome: 'StockAI', titulo: 'StockAI', resumo: 'Um chat para consultar seu estoque.', icone: Bot },
  configuracoes: { nome: 'Configurações', titulo: 'Configurações', resumo: 'Gerencie suas preferências e integrações', icone: Settings },
}

function Marca() {
  return <div className="marca"><span className="marca-icone"><Boxes size={22} /></span><span>SMART<span>STOCK</span><small>GESTÃO INTELIGENTE</small></span></div>
}

export function IlustracaoEstoque() {
  return <svg className="ilustracao-estoque" viewBox="0 0 432 232" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="1.5">
      <path className="orbita" d="M2 181 217 57l213 124-86 49H89zM45 181 217 82l171 99M88 181l129-74 128 74M131 181l86-49 85 49" />
      <path className="caixa-lateral" d="m65 126 65-38 66 38v42l-66 38-65-38z" />
      <path d="m65 126 65 38 66-38m-66 38v42m-32-99 65 38" />
      <path className="caixa-lateral" d="m236 126 66-38 65 38v42l-65 38-66-38z" />
      <path d="m236 126 66 38 65-38m-65 38v42m-33-99 66 38" />
      <path className="caixa-principal" d="m150 68 67-39 67 39v80l-67 39-67-39z" />
      <path d="m150 68 67 39 67-39m-67 39v80m-32-139 67 39" />
      <path d="m227 134 25-15m-25 22 15-9M56 69v20m-10-10h20m277-48v14m-7-7h14M116 42l7-7 7 7-7 7zM366 92l6-6 6 6-6 6z" />
    </g>
    <circle cx="288" cy="19" r="2.5" fill="currentColor" />
    <circle cx="399" cy="131" r="2.5" fill="currentColor" />
    <circle cx="29" cy="140" r="2.5" fill="currentColor" />
  </svg>
}

export function Formulario({ onSubmit, children, mensagemInvalida, ...props }) {
  const [validacao, setValidacao] = useState('')

  function validar(evento) {
    evento.preventDefault()
    const campo = evento.target
    const primeiro = evento.currentTarget.querySelector('input:invalid, select:invalid, textarea:invalid')
    if (campo !== primeiro) return
    setValidacao(mensagemInvalida?.(campo) ?? campo.validationMessage)
    campo.focus()
  }

  return <form {...props} onInvalid={validar} onInput={() => setValidacao('')} onSubmit={evento => {
    setValidacao('')
    onSubmit(evento)
  }}>
    {children}
    {validacao && <p className="erro erro-formulario" role="alert"><CircleAlert size={16} aria-hidden="true" /> {validacao}</p>}
  </form>
}

function mensagemLogin(campo) {
  if (campo.name === 'email') {
    return campo.validity.valueMissing ? 'Informe seu e-mail.' : 'Digite um e-mail válido, como demo@smartstock.test.'
  }
  return campo.validity.valueMissing ? 'Informe a senha de demonstração.' : 'Use uma senha fictícia com pelo menos 6 caracteres.'
}

export function Login({ entrar }) {
  const [mostrar, setMostrar] = useState(false)
  function enviar(evento) {
    evento.preventDefault()
    entrar(new FormData(evento.currentTarget).get('email'))
  }

  return (
    <main className="login">
      <section className="login-visual">
        <Marca />
        <div className="login-intro">
          <p className="sobretitulo">PLATAFORMA DE ESTOQUE</p>
          <h1>Controle seu estoque<span>.</span></h1>
          <p>Tenha uma visão inteligente de cada movimentação.</p>
          <IlustracaoEstoque />
        </div>
        <span className="login-rodape">SMARTSTOCK / PROJETO INTEGRADOR</span>
      </section>
      <section className="login-form">
        <div className="card login-painel">
          <p className="sobretitulo">ACESSO À PLATAFORMA</p>
          <h2>Bem-vindo de volta</h2>
          <p className="muted">Entre na sua conta para continuar.</p>
          <Formulario className="campos" onSubmit={enviar} mensagemInvalida={mensagemLogin}>
            <div className="login-campo">
              <label htmlFor="login-email">E-mail</label>
              <div className="login-input">
                <Mail size={17} aria-hidden="true" />
                <input id="login-email" type="email" name="email" placeholder="seuemail@empresa.com" autoComplete="username" required />
              </div>
            </div>
            <div className="login-campo">
              <label htmlFor="login-senha">Senha</label>
              <div className="login-input campo-senha">
                <LockKeyhole size={17} aria-hidden="true" />
                <input id="login-senha" type={mostrar ? 'text' : 'password'} name="senha" placeholder="••••••••" autoComplete="current-password" minLength="6" aria-describedby="login-ajuda" required />
                <button type="button" className="icone" onClick={() => setMostrar(!mostrar)} aria-label={mostrar ? 'Ocultar senha' : 'Mostrar senha'}>{mostrar ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <button className="primario botao-destaque">Entrar <ArrowRight size={18} aria-hidden="true" /></button>
          </Formulario>
          <p className="nota" id="login-ajuda"><ShieldCheck size={17} aria-hidden="true" /> Ambiente de demonstração. Use um e-mail de teste e uma senha fictícia de pelo menos 6 caracteres.</p>
        </div>
      </section>
    </main>
  )
}

export function Estrutura({ pagina, perfil, sair, children }) {
  const [menu, setMenu] = useState(false)
  const tela = telas[pagina]
  return (
    <div className="app">
      <a className="pular" href="#conteudo" onClick={evento => { evento.preventDefault(); document.querySelector('main').focus() }}>Ir para o conteúdo</a>
      <aside className="sidebar">
        <Marca />
        <button className="icone menu" type="button" aria-expanded={menu} aria-controls="navegacao" aria-label={menu ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
        <div id="navegacao" className={menu ? 'navegacao aberta' : 'navegacao'}>
          <p className="nav-legenda">ESPAÇO DE TRABALHO</p>
          <nav aria-label="Menu principal">
            {Object.entries(telas).map(([id, item]) => (
              <a key={id} href={'#' + id} aria-current={pagina === id ? 'page' : undefined} onClick={() => setMenu(false)}><item.icone size={19} />{item.nome}</a>
            ))}
          </nav>
          <div className="sidebar-rodape"><Avatar nome={perfil.nome} /><div><strong>{perfil.nome}</strong><small>Demonstração</small></div><button className="icone" onClick={sair} aria-label="Sair"><LogOut size={18} /></button></div>
        </div>
      </aside>
      <main id="conteudo" className="conteudo" tabIndex="-1">
        <header className="cabecalho">
          <div><p className="sobretitulo">SMARTSTOCK / GESTÃO DE ESTOQUE</p><h1>{tela.titulo}</h1><p>{tela.resumo}</p></div>
          <span className="ambiente"><i /> Ambiente demo</span>
        </header>
        {children}
      </main>
    </div>
  )
}

export function Avatar({ nome }) {
  return <span className="avatar" aria-hidden="true">{nome.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join('').toUpperCase()}</span>
}

export function Indicador({ titulo, valor, detalhe, icone: Icon, tom = 'rosa' }) {
  return <article className="card indicador"><span className={'tile ' + tom}><Icon size={20} /></span><p>{titulo}</p><strong>{numero.format(valor)}</strong><small>{detalhe}</small></article>
}

export function Card({ titulo, resumo, children }) {
  return <section className="card painel"><h2>{titulo}</h2>{resumo && <p className="muted">{resumo}</p>}{children}</section>
}

export function Tabela({ colunas, children, vazio = 'Nenhum registro encontrado.' }) {
  return <div className="tabela" tabIndex="0" role="region" aria-label="Tabela de resultados">
    <table><thead><tr>{colunas.map(coluna => <th key={coluna} scope="col">{coluna}</th>)}</tr></thead>
      <tbody>{children.length ? children : <tr><td className="vazio" colSpan={colunas.length}>{vazio}</td></tr>}</tbody></table>
  </div>
}

export function Historico({ movimentos }) {
  return <Tabela colunas={['Produto', 'Tipo', 'Quantidade', 'Data', 'Responsável', 'Observação']} vazio="Ainda não há movimentações para exibir.">
    {movimentos.map(item => <tr key={item.id}>
      <td><strong>{item.produtoNome}</strong></td>
      <td><span className={'badge ' + item.tipo}>{item.tipo === 'entrada' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}{item.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
      <td>{item.tipo === 'entrada' ? '+' : '−'}{numero.format(item.quantidade)}</td>
      <td>{dataBR(item.data)}</td><td>{item.responsavel}</td><td>{item.observacao || '—'}</td>
    </tr>)}
  </Tabela>
}

export function Grafico({ grupos }) {
  const series = grupos.map(({ rotulo, movimentos }) => ({
    rotulo,
    entrada: somaMovimentos(movimentos, 'entrada'),
    saida: somaMovimentos(movimentos, 'saida'),
  }))
  const pico = Math.max(1, ...series.flatMap(item => [item.entrada, item.saida]))
  const base = 10 ** Math.floor(Math.log10(pico))
  const maximo = Math.ceil(pico / base) * base
  const marcas = [maximo, maximo / 2, 0]
  return <>
    <div className="legenda"><span><i /> Entradas</span><span><i /> Saídas</span></div>
    <div className="grafico-area">
      <div className="grafico-eixo" aria-hidden="true">{marcas.map(marca => <span key={marca}>{numero.format(marca)}</span>)}</div>
      <div className="grafico" role="list" aria-label="Unidades de entrada e saída">
      {series.map(item => <div key={item.rotulo} role="listitem" aria-label={`${item.rotulo}: ${item.entrada} entradas e ${item.saida} saídas`}>
        <div className="barras" tabIndex="0" role="img" aria-label={`${item.rotulo}: ${item.entrada} entradas e ${item.saida} saídas`}>
          <span style={{ height: item.entrada / maximo * 100 + '%' }} />
          <span style={{ height: item.saida / maximo * 100 + '%' }} />
          <span className="grafico-dica" aria-hidden="true">{numero.format(item.entrada)} entradas · {numero.format(item.saida)} saídas</span>
        </div><small>{item.rotulo}</small>
      </div>)}
      </div>
    </div>
  </>
}
