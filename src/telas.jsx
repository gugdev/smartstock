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
  return <div className="pilha">
    <section className="destaque" aria-labelledby="destaque-titulo">
      <div>
        <p className="sobretitulo">CENTRAL DE OPERAÇÕES</p>
        <h2 id="destaque-titulo">Seu estoque em movimento<span>.</span></h2>
        <p>Registre entradas e saídas e acompanhe o saldo em tempo real nesta demonstração.</p>
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
        {baixos.length ? <ul className="lista">{baixos.slice(0, 5).map(item => <li key={item.id}><div><strong>{item.nome}</strong><small>Mínimo de {item.minimo} un.</small></div><span className="badge baixo">{item.quantidade} un.</span></li>)}</ul> : <p className="muted">Todos os produtos estão acima do mínimo.</p>}
        <a className="link" href="#produtos">Ver produtos</a>
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
  const categorias = [...new Set(estoque.produtos.map(item => item.categoria))].sort()
  const produtos = estoque.produtos.filter(item =>
    item.nome.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR')) &&
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
    if (!selecionado.id) {
      setBusca('')
      setCategoria('')
      setStatus('ativos')
    }
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

  return <Card titulo="Catálogo de produtos" resumo="O saldo dos itens cadastrados muda pela tela de Movimentações.">
    <div className="filtros produtos-filtros">
      <label>Buscar produto<span className="busca"><Search size={17} /><input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome do produto" /></span></label>
      <label>Categoria<select value={categoria} onChange={e => setCategoria(e.target.value)}><option value="">Todas</option>{categorias.map(item => <option key={item}>{item}</option>)}</select></label>
      <label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="ativos">Ativos</option><option value="baixo">Estoque baixo</option><option value="inativos">Inativos</option><option value="todos">Todos</option></select></label>
      <button className="primario" onClick={() => { window.location.hash = 'produtos/novo' }}><Plus size={17} /> Novo produto</button>
    </div>
    <p className="mensagem" role="status">{mensagem}</p>
    <Tabela colunas={['Produto', 'Categoria', 'Quantidade', 'Estoque mín.', 'Preço', 'Status', 'Ações']}>
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
        <button className="primario">Salvar produto</button>
      </form>}
    </dialog>
  </Card>
}

export function Movimentacoes({ estoque, atualizar }) {
  const [tipo, setTipo] = useState('entrada')
  const [produtoId, setProdutoId] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const produtos = estoque.produtos.filter(item => item.ativo)
  const produto = produtos.find(item => item.id === produtoId)

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

  return <div className="pilha">
    <div className="duas-colunas">
      <Card titulo="Nova movimentação" resumo="Selecione o tipo de operação e informe os dados.">
        <div className="segmentos" role="group" aria-label="Tipo de movimentação">
          <button type="button" aria-pressed={tipo === 'entrada'} onClick={() => { setTipo('entrada'); setErro('') }}>Entrada</button>
          <button type="button" aria-pressed={tipo === 'saida'} onClick={() => { setTipo('saida'); setErro('') }}>Saída</button>
        </div>
        <form className="campos" onSubmit={registrar}>
          <label>Produto<select required value={produtoId} onChange={e => { setProdutoId(e.target.value); setErro('') }}><option value="">Selecione um produto</option>{produtos.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
          <div className="campos-duplos">
            <label>Quantidade<input name="quantidade" type="number" min="1" step="1" placeholder="Ex.: 10" required /></label>
            <label>Data<input name="data" type="date" min="1900-01-01" max={dataLocal()} defaultValue={dataLocal()} required /></label>
          </div>
          <label>Observação<textarea name="observacao" rows="3" maxLength="255" placeholder="Motivo da movimentação (opcional)" /></label>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button className="primario" disabled={!produtos.length}>Registrar movimentação</button>
          <p role="status" className="mensagem">{mensagem}</p>
        </form>
      </Card>
      <Card titulo="Resumo do produto" resumo="Acompanhe o saldo antes de registrar.">
        <div className="resumo-produto"><span className="tile rosa"><Package size={20} /></span><strong>{produto?.nome || 'Nenhum produto selecionado'}</strong>
          {produto && <p>Saldo atual: <b>{numero.format(produto.quantidade)} un.</b></p>}
        </div>
        <p className="dica"><CircleAlert size={18} /> Saídas acima do saldo disponível são bloqueadas.</p>
      </Card>
    </div>
    <Card titulo="Histórico de movimentações"><Historico movimentos={estoque.movimentos} /></Card>
  </div>
}

export function Relatorios({ estoque }) {
  const [filtros, setFiltros] = useState({ inicio: dataAnterior(29), fim: dataLocal(), produto: '', tipo: '' })
  const [erro, setErro] = useState('')
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
    const novosFiltros = Object.fromEntries(new FormData(evento.currentTarget))
    if (novosFiltros.inicio && novosFiltros.fim && novosFiltros.inicio > novosFiltros.fim) {
      setErro('A data inicial deve vir antes ou coincidir com a data final.')
      return
    }
    setErro('')
    setFiltros(novosFiltros)
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
    link.download = 'smartstock-movimentacoes.csv'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <div className="pilha">
    <Card titulo="Filtros do relatório">
      <form className="filtros" onSubmit={aplicar}>
        <label>De<input name="inicio" type="date" defaultValue={filtros.inicio} /></label>
        <label>Até<input name="fim" type="date" defaultValue={filtros.fim} /></label>
        <label>Produto<select name="produto"><option value="">Todos os produtos</option>{estoque.produtos.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
        <label>Tipo<select name="tipo"><option value="">Todos os tipos</option><option value="entrada">Entrada</option><option value="saida">Saída</option></select></label>
        <button className="primario">Aplicar filtros</button>
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
    <Card titulo="Movimentações do período">
      <button type="button" className="secundario exportar" onClick={exportar} disabled={!movimentos.length}><Download size={16} /> Exportar CSV</button>
      <Historico movimentos={movimentos} />
    </Card>
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
