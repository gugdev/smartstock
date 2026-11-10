import { useEffect, useRef, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, ArrowRight, Boxes, CircleAlert, Download, Package, Plus, Search, X } from 'lucide-react'
import { Avatar, Card, Grafico, Historico, IlustracaoEstoque, Indicador, Tabela } from './componentes'
import { dataAnterior, dataBR, dataLocal, estoqueBaixo, moeda, numero, registrarMovimento, somaMovimentos, totalUnidades } from './estoque'

export function Dashboard({ estoque }) {
  const ativos = estoque.produtos.filter(produto => produto.ativo)
  const baixos = ativos.filter(estoqueBaixo)
  const mes = dataLocal().slice(0, 7)
  const movimentosMes = estoque.movimentos.filter(item => item.data.startsWith(mes) && item.data <= dataLocal())
  const semana = Array.from({ length: 7 }, (_, indice) => {
    const dia = dataAnterior(6 - indice)
    return { rotulo: dataBR(dia).slice(0, 5), movimentos: estoque.movimentos.filter(item => item.data === dia) }
  })
  return <div className="pilha dashboard">
    <section className="destaque" aria-labelledby="destaque-titulo">
      <div>
        <p className="sobretitulo">CENTRAL DE OPERAÇÕES</p>
        <h2 id="destaque-titulo">Seu estoque em movimento<span>.</span></h2>
        <p>Acompanhe o saldo e registre as movimentações do dia.</p>
        <a href="#movimentacoes" className="primario">Registrar movimentação <ArrowRight size={17} /></a>
      </div>
      <IlustracaoEstoque />
    </section>
    <div className="indicadores cinco">
      <Indicador titulo="Produtos cadastrados" valor={ativos.length} detalhe="Itens ativos no catálogo" icone={Package} />
      <Indicador titulo="Unidades em estoque" valor={totalUnidades(ativos)} detalhe="Saldo dos produtos ativos" icone={Boxes} />
      <Indicador titulo="Estoque baixo" valor={baixos.length} detalhe="Precisam de reposição" icone={CircleAlert} tom="amarelo" />
      <Indicador titulo="Entradas no mês" valor={somaMovimentos(movimentosMes, 'entrada')} detalhe="Unidades recebidas" icone={ArrowDownLeft} tom="verde" />
      <Indicador titulo="Saídas no mês" valor={somaMovimentos(movimentosMes, 'saida')} detalhe="Unidades retiradas" icone={ArrowUpRight} tom="roxo" />
    </div>
    <div className="duas-colunas">
      <Card titulo="Movimentações de estoque" resumo="Entradas e saídas nos últimos 7 dias"><Grafico grupos={semana} /></Card>
      <Card titulo="Alertas de reposição" resumo="Produtos no limite mínimo ou abaixo dele">
        {baixos.length ? <ul className="lista lista-reposicao">{baixos.slice(0, 5).map(item => (
          <li key={item.id}>
            <span className="tile amarelo"><Package size={17} aria-hidden="true" /></span>
            <div><strong>{item.nome}</strong><small>Mínimo de {numero.format(item.minimo)} un.</small></div>
            <span className="badge baixo">{numero.format(item.quantidade)} un.</span>
          </li>
        ))}</ul> : <p className="muted">Nenhum produto ativo atingiu o estoque mínimo.</p>}
        <a className="link link-reposicao" href="#produtos">Ver catálogo <ArrowRight size={15} aria-hidden="true" /></a>
      </Card>
    </div>
    <Card titulo="Movimentações recentes"><Historico movimentos={estoque.movimentos.slice(0, 5)} /></Card>
  </div>
}

export function Produtos({ estoque, atualizar, rota }) {
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [status, setStatus] = useState('ativos')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const dialogo = useRef(null)
  const campoBusca = useRef(null)
  const categorias = [...new Set(estoque.produtos.map(item => item.categoria))].sort()
  const buscaNormalizada = busca.trim().toLocaleLowerCase('pt-BR')
  const temFiltros = Boolean(buscaNormalizada || categoria || status !== 'ativos')
  const produtos = estoque.produtos.filter(item =>
    item.nome.toLocaleLowerCase('pt-BR').includes(buscaNormalizada) &&
    (!categoria || item.categoria === categoria) &&
    (status === 'todos' || (status === 'inativos' ? !item.ativo : item.ativo && (status !== 'baixo' || estoqueBaixo(item))))
  )

  const [, acao, id] = rota.split('/')
  const selecionado = acao === 'novo' ? {} : acao === 'editar' ? estoque.produtos.find(item => item.id === id) : null
  const formularioAberto = Boolean(selecionado)

  useEffect(() => {
    const modal = dialogo.current
    setErro('')
    if (formularioAberto && !modal.open) modal.showModal()
    if (!formularioAberto && modal.open) modal.close()
    if (acao === 'editar' && !formularioAberto) {
      setMensagem('Produto não encontrado.')
      window.location.replace('#produtos')
    }
  }, [acao, id, formularioAberto])

  function fechar() {
    window.location.replace('#produtos')
  }

  function limparFiltros() {
    setBusca('')
    setCategoria('')
    setStatus('ativos')
  }

  function salvar(evento) {
    evento.preventDefault()
    const campos = new FormData(evento.currentTarget)
    const dados = {
      nome: campos.get('nome').trim(),
      categoria: campos.get('categoria').trim(),
      minimo: Number(campos.get('minimo')),
      preco: Number(campos.get('preco')),
    }
    const quantidade = selecionado.id ? selecionado.quantidade : Number(campos.get('quantidade'))
    if (!dados.nome || !dados.categoria) {
      setErro('Preencha nome e categoria com texto válido.')
      return
    }
    if (![quantidade, dados.minimo].every(valor => Number.isSafeInteger(valor) && valor >= 0)) {
      setErro('Informe quantidades inteiras dentro do limite suportado.')
      return
    }
    const produto = { id: crypto.randomUUID(), ativo: true, ...selecionado, ...dados, quantidade }
    const lista = selecionado.id
      ? estoque.produtos.map(item => item.id === produto.id ? produto : item)
      : [...estoque.produtos, produto]
    atualizar({ ...estoque, produtos: lista })
    if (!selecionado.id) limparFiltros()
    fechar()
    setMensagem(selecionado.id ? 'Produto atualizado.' : 'Produto cadastrado.')
  }

  function alterarStatus(produto) {
    if (produto.ativo && !window.confirm(`Inativar "${produto.nome}"? O histórico será preservado.`)) return
    atualizar({
      ...estoque,
      produtos: estoque.produtos.map(item => item.id === produto.id ? { ...item, ativo: !item.ativo } : item),
    })
    setMensagem(produto.ativo ? 'Produto inativado.' : 'Produto reativado.')
  }

  return <section className="card painel catalogo" aria-labelledby="titulo-catalogo">
    <div className="painel-cabecalho">
      <span className="tile rosa"><Package size={20} aria-hidden="true" /></span>
      <div>
        <h2 id="titulo-catalogo">Catálogo de produtos</h2>
        <p className="muted">Confira os saldos e mantenha os cadastros em dia.</p>
      </div>
      <button type="button" className="primario botao-destaque" onClick={() => { window.location.hash = 'produtos/novo' }}><Plus size={18} aria-hidden="true" /> Novo produto</button>
    </div>
    <div className="produtos-filtros" role="group" aria-label="Filtros do catálogo">
      <label>Buscar produto<span className="busca"><Search size={17} aria-hidden="true" /><input ref={campoBusca} type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Ex.: Papel A4" /></span></label>
      <label>Categoria<select value={categoria} onChange={e => setCategoria(e.target.value)}><option value="">Todas as categorias</option>{categorias.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="ativos">Ativos</option><option value="baixo">Estoque baixo</option><option value="inativos">Inativos</option><option value="todos">Todos</option></select></label>
    </div>
    <p className="mensagem" role="status">{mensagem}</p>
    <div className="catalogo-resultados">
      <p aria-live="polite">{numero.format(produtos.length)} {produtos.length === 1 ? 'produto exibido' : 'produtos exibidos'}</p>
      {temFiltros && <button type="button" className="secundario pequeno" onClick={() => { limparFiltros(); campoBusca.current.focus() }}><X size={15} aria-hidden="true" /> Limpar filtros</button>}
    </div>
    <Tabela colunas={['Produto', 'Categoria', 'Saldo', 'Mínimo', 'Preço', 'Status', 'Ações']} vazio={temFiltros ? 'Nenhum produto encontrado com esses filtros.' : 'Nenhum produto ativo no catálogo.'}>
      {produtos.map(item => <tr key={item.id}><td><div className="produto-celula"><span aria-hidden="true"><Package size={16} /></span><strong>{item.nome}</strong></div></td><td>{item.categoria}</td>
        <td>{numero.format(item.quantidade)}</td><td>{numero.format(item.minimo)}</td><td>{moeda.format(item.preco)}</td>
        <td><span className={'badge ' + (item.ativo ? (estoqueBaixo(item) ? 'baixo' : 'entrada') : 'neutro')}>{item.ativo ? (estoqueBaixo(item) ? 'Estoque baixo' : 'Normal') : 'Inativo'}</span></td>
        <td><div className="acoes"><button className="secundario pequeno" aria-label={'Editar ' + item.nome} onClick={() => { window.location.hash = 'produtos/editar/' + item.id }}>Editar</button><button className="secundario pequeno" aria-label={(item.ativo ? 'Inativar ' : 'Reativar ') + item.nome} onClick={() => alterarStatus(item)}>{item.ativo ? 'Inativar' : 'Reativar'}</button></div></td>
      </tr>)}
    </Tabela>
    <dialog ref={dialogo} aria-labelledby="titulo-produto" onCancel={evento => { evento.preventDefault(); fechar() }}>
      {selecionado && <form className="campos" key={selecionado.id || 'novo'} onSubmit={salvar}>
        <div className="linha"><h2 id="titulo-produto">{selecionado.id ? 'Editar produto' : 'Novo produto'}</h2><button type="button" className="icone" aria-label="Fechar" onClick={fechar}><X size={20} /></button></div>
        <label>Nome<input autoFocus name="nome" defaultValue={selecionado.nome} maxLength="120" required /></label>
        <label>Categoria<input name="categoria" defaultValue={selecionado.categoria} list="categorias" maxLength="80" required /></label>
        <datalist id="categorias">{categorias.map(item => <option key={item} value={item} />)}</datalist>
        {!selecionado.id && <label>Quantidade inicial<input name="quantidade" type="number" min="0" step="1" defaultValue="0" required /></label>}
        <div className="campos-duplos">
          <label>Estoque mínimo<input name="minimo" type="number" min="0" step="1" defaultValue={selecionado.minimo ?? 0} required /></label>
          <label>Preço (R$)<input name="preco" type="number" min="0" max="99999999.99" step="0.01" defaultValue={selecionado.preco} required /></label>
        </div>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button className="primario botao-destaque">Salvar produto</button>
      </form>}
    </dialog>
  </section>
}

export function Movimentacoes({ estoque, atualizar }) {
  const [tipo, setTipo] = useState('entrada')
  const [produtoId, setProdutoId] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const produtos = estoque.produtos.filter(item => item.ativo)
  const produto = produtos.find(item => item.id === produtoId)
  const TipoIcone = tipo === 'entrada' ? ArrowDownLeft : ArrowUpRight

  function registrar(evento) {
    evento.preventDefault()
    setErro('')
    setMensagem('')
    const formulario = evento.currentTarget
    const campos = new FormData(formulario)
    try {
      atualizar(registrarMovimento(estoque, {
        produtoId, tipo, quantidade: Number(campos.get('quantidade')),
        data: campos.get('data'), observacao: campos.get('observacao').trim(),
      }))
      formulario.elements.quantidade.value = ''
      formulario.elements.observacao.value = ''
      setMensagem('Movimentação registrada. Saldo atualizado.')
    } catch (falha) {
      setErro(falha.message)
    }
  }

  return <div className="pilha movimentacoes">
    <div className="duas-colunas movimentacoes-paineis">
      <Card titulo="Nova movimentação" resumo="Escolha se as unidades entram ou saem do estoque.">
        <div className="segmentos" role="group" aria-label="Tipo de movimentação">
          <button className="tipo-entrada" type="button" aria-pressed={tipo === 'entrada'} onClick={() => { setTipo('entrada'); setErro('') }}><ArrowDownLeft size={18} aria-hidden="true" /> Entrada</button>
          <button className="tipo-saida" type="button" aria-pressed={tipo === 'saida'} onClick={() => { setTipo('saida'); setErro('') }}><ArrowUpRight size={18} aria-hidden="true" /> Saída</button>
        </div>
        <form className="campos" onSubmit={registrar}>
          <label>Produto<select required value={produtoId} onChange={e => { setProdutoId(e.target.value); setErro('') }}><option value="">Selecione um produto</option>{produtos.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
          <div className="campos-duplos">
            <label>Quantidade<input name="quantidade" type="number" min="1" step="1" placeholder="Ex.: 10" required /></label>
            <label>Data<input name="data" type="date" min="1900-01-01" max={dataLocal()} defaultValue={dataLocal()} required /></label>
          </div>
          <label><span>Observação <small className="campo-opcional">opcional</small></span><textarea name="observacao" rows="3" maxLength="255" placeholder="Ex.: Reposição de material" /></label>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button className="primario" disabled={!produtos.length}><TipoIcone size={18} aria-hidden="true" /> Registrar movimentação</button>
          <p role="status" className="mensagem">{mensagem}</p>
        </form>
      </Card>
      <Card titulo="Saldo do produto" resumo="Confira o estoque disponível antes de registrar.">
        <div className="resumo-produto" aria-live="polite">
          <span className="tile rosa"><Package size={20} aria-hidden="true" /></span>
          <strong>{produto?.nome || 'Selecione um produto'}</strong>
          {produto && <p>Saldo atual <b>{numero.format(produto.quantidade)} un.</b></p>}
        </div>
        <p className="dica"><CircleAlert size={18} /> Saídas acima do saldo disponível são bloqueadas.</p>
      </Card>
    </div>
    <div className="painel-historico">
      <Card titulo="Histórico de movimentações" resumo={`${numero.format(estoque.movimentos.length)} ${estoque.movimentos.length === 1 ? 'registro' : 'registros'} · Ordem de lançamento`}>
        <Historico movimentos={estoque.movimentos} />
      </Card>
    </div>
  </div>
}

export function Relatorios({ estoque }) {
  const [padrao] = useState(() => ({ inicio: dataAnterior(29), fim: dataLocal(), produto: '', tipo: '' }))
  const [filtros, setFiltros] = useState(padrao)
  const [rascunho, setRascunho] = useState(padrao)
  const [erro, setErro] = useState('')
  const pendente = Object.keys(filtros).some(campo => filtros[campo] !== rascunho[campo])
  const alterado = Object.keys(padrao).some(campo => filtros[campo] !== padrao[campo])
  const movimentos = estoque.movimentos.filter(item =>
    (!filtros.inicio || item.data >= filtros.inicio) && (!filtros.fim || item.data <= filtros.fim) &&
    (!filtros.produto || item.produtoId === filtros.produto) && (!filtros.tipo || item.tipo === filtros.tipo)
  )
  const entradas = somaMovimentos(movimentos, 'entrada')
  const saidas = somaMovimentos(movimentos, 'saida')
  const ativos = estoque.produtos.filter(item => item.ativo)
  const baixos = ativos.filter(estoqueBaixo)
  const resumoCategorias = Object.entries(Object.groupBy(ativos, item => item.categoria))
  const porMes = Object.entries(Object.groupBy(movimentos, item => item.data.slice(0, 7))).sort(([a], [b]) => a.localeCompare(b))
  const grupos = porMes.length > 1
    ? porMes.slice(-6).map(([mes, itens]) => ({ rotulo: mes.split('-').reverse().join('/'), movimentos: itens }))
    : [{ rotulo: 'Período', movimentos }]

  function aplicar(evento) {
    evento.preventDefault()
    if (rascunho.inicio && rascunho.fim && rascunho.inicio > rascunho.fim) {
      setErro('A data inicial deve vir antes ou coincidir com a data final.')
      return
    }
    setErro('')
    setFiltros(rascunho)
  }

  function alterarFiltro(evento) {
    const { name, value } = evento.target
    setRascunho({ ...rascunho, [name]: value })
    setErro('')
  }

  function restaurar() {
    setRascunho(padrao)
    setFiltros(padrao)
    setErro('')
  }

  function exportar() {
    const escapar = valor => {
      const texto = String(valor)
      const seguro = /^\s*[=+\-@]|^[\t\r\n]/.test(texto) ? "'" + texto : texto
      return '"' + seguro.replaceAll('"', '""') + '"'
    }
    const linhas = [['Produto', 'Tipo', 'Quantidade', 'Data', 'Responsável', 'Observação'],
      ...movimentos.map(item => [item.produtoNome, item.tipo === 'entrada' ? 'Entrada' : 'Saída', item.quantidade, dataBR(item.data), item.responsavel, item.observacao])]
    const csv = '\uFEFF' + linhas.map(linha => linha.map(escapar).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'smartstock-movimentacoes-' + dataLocal() + '.csv'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <div className="pilha relatorios">
    <Card titulo="Filtros do relatório" resumo="Escolha quais movimentações quer consultar.">
      <form onSubmit={aplicar}>
        <div className="relatorio-filtros">
          <label>De<input name="inicio" type="date" value={rascunho.inicio} onChange={alterarFiltro} /></label>
          <label>Até<input name="fim" type="date" value={rascunho.fim} onChange={alterarFiltro} /></label>
          <label>Produto<select name="produto" value={rascunho.produto} onChange={alterarFiltro}><option value="">Todos os produtos</option>{estoque.produtos.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
          <label>Tipo<select name="tipo" value={rascunho.tipo} onChange={alterarFiltro}><option value="">Todos os tipos</option><option value="entrada">Entrada</option><option value="saida">Saída</option></select></label>
        </div>
        <div className="relatorio-filtros-acoes">
          <button className="primario botao-destaque">Aplicar filtros</button>
          <button type="button" className="secundario" onClick={restaurar} disabled={!alterado && !pendente}>Restaurar padrão</button>
          {pendente && <p className="muted">Aplique os filtros para atualizar a tabela e o CSV.</p>}
        </div>
      </form>
      {erro && <p className="erro" role="alert">{erro}</p>}
    </Card>
    <div className="indicadores">
      <Indicador titulo="Total de entradas" valor={entradas} detalhe="Unidades no período" icone={ArrowDownLeft} tom="verde" />
      <Indicador titulo="Total de saídas" valor={saidas} detalhe="Unidades no período" icone={ArrowUpRight} tom="roxo" />
      <Indicador titulo="Saldo movimentado" valor={entradas - saidas} detalhe="Entradas menos saídas" icone={ArrowLeftRight} />
    </div>
    <div className="duas-colunas">
      <Card titulo="Entradas × saídas" resumo={porMes.length > 6 ? 'Seis meses mais recentes dos resultados.' : 'Comparativo em unidades no período selecionado.'}><Grafico grupos={grupos} /></Card>
      <Card titulo="Resumo por categoria" resumo="Distribuição dos produtos ativos no catálogo.">
        <ul className="lista">{resumoCategorias.map(([nome, itens]) => <li key={nome}><strong>{nome}</strong><span className="badge neutro">{itens.length} / {ativos.length}</span></li>)}</ul>
        {!ativos.length && <p className="muted">Nenhum produto ativo.</p>}
      </Card>
    </div>
    <Card titulo="Produtos cadastrados" resumo={`${estoque.produtos.length} registros no catálogo · ${baixos.length} com estoque baixo`}>
      <Tabela colunas={['Produto', 'Categoria', 'Saldo', 'Mínimo', 'Status']}>
        {estoque.produtos.map(item => <tr key={item.id}><td><strong>{item.nome}</strong></td><td>{item.categoria}</td><td>{numero.format(item.quantidade)}</td><td>{numero.format(item.minimo)}</td><td><span className={'badge ' + (item.ativo && estoqueBaixo(item) ? 'baixo' : 'neutro')}>{item.ativo ? (estoqueBaixo(item) ? 'Estoque baixo' : 'Normal') : 'Inativo'}</span></td></tr>)}
      </Tabela>
    </Card>
    <section className="card painel painel-historico" aria-labelledby="titulo-relatorio-movimentos">
      <div className="painel-cabecalho">
        <span className="tile rosa"><ArrowLeftRight size={20} aria-hidden="true" /></span>
        <div>
          <h2 id="titulo-relatorio-movimentos">Movimentações do período</h2>
          <p className="muted" aria-live="polite">{numero.format(movimentos.length)} {movimentos.length === 1 ? 'registro' : 'registros'} · {movimentos.length ? 'O CSV inclui os registros exibidos abaixo.' : 'Nenhum registro para exportar.'}</p>
        </div>
        <button type="button" className="primario botao-destaque" onClick={exportar} disabled={!movimentos.length}><Download size={17} aria-hidden="true" /> Exportar CSV</button>
      </div>
      <Historico movimentos={movimentos} />
    </section>
  </div>
}

export function Configuracoes({ estoque, atualizar, email }) {
  const [mensagem, setMensagem] = useState('')
  function salvar(evento) {
    evento.preventDefault()
    const dados = new FormData(evento.currentTarget)
    const nome = dados.get('nome').trim()
    if (!nome) {
      setMensagem('Informe um nome válido.')
      return
    }
    atualizar({ ...estoque, perfil: { nome, alertas: dados.has('alertas') } })
    setMensagem('Preferências locais salvas.')
  }
  return <div className="duas-colunas">
    <Card titulo="Perfil e notificações" resumo="Personalize seu ambiente de demonstração.">
      <div className="perfil"><Avatar nome={estoque.perfil.nome} /><span><strong>{estoque.perfil.nome}</strong><small>{email}</small></span></div>
      <form className="campos" onSubmit={salvar}>
        <label>Nome de exibição<input name="nome" defaultValue={estoque.perfil.nome} maxLength="120" required /></label>
        <label className="checkbox"><input name="alertas" type="checkbox" defaultChecked={estoque.perfil.alertas} /> Receber alertas de estoque mínimo quando houver integração</label>
        <button className="primario">Salvar preferências</button>
        <p className="mensagem" role="status">{mensagem}</p>
      </form>
    </Card>
    <div className="pilha">
      <Card titulo="Integrações" resumo="Recursos planejados para a Aula 9."><ul className="lista"><li>Agente de IA <span className="badge neutro">Futuro</span></li><li>Automação com n8n <span className="badge neutro">Futuro</span></li></ul></Card>
      <Card titulo="Segurança e acesso" resumo="Autenticação e permissões de usuários entram com a API da Aula 8." />
    </div>
  </div>
}
