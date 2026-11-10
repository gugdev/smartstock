import { useRef, useState } from 'react'
import { ArrowUp, Bot, CircleAlert, ClipboardList, PackageSearch } from 'lucide-react'

const sugestoes = [
  { Icone: CircleAlert, pergunta: 'Quais produtos atingiram o estoque mínimo?' },
  { Icone: ClipboardList, pergunta: 'Quais foram as últimas movimentações?' },
  { Icone: PackageSearch, pergunta: 'Qual é o saldo do Papel A4?' },
]

export function StockAI() {
  const [rascunho, setRascunho] = useState('')
  const campo = useRef(null)

  return <section className="card stockai" aria-labelledby="stockai-titulo">
    <header className="stockai-topo">
      <span className="tile rosa"><Bot size={21} aria-hidden="true" /></span>
      <h2 id="stockai-titulo">Chat do estoque</h2>
      <span className="badge neutro">Prévia da interface</span>
    </header>
    <div className="stockai-conteudo">
      <p className="sobretitulo">EXEMPLOS DE CONSULTA</p>
      <h3>O que você quer saber sobre o estoque?</h3>
      <p className="muted">Escolha uma pergunta para preencher o rascunho.</p>
      <ul className="stockai-sugestoes">
        {sugestoes.map(({ Icone, pergunta }) => <li key={pergunta}>
          <button className="secundario" type="button" onClick={() => {
            setRascunho(pergunta)
            campo.current.focus()
          }}>
            <Icone size={18} aria-hidden="true" /> {pergunta}
          </button>
        </li>)}
      </ul>
    </div>
    <div className="stockai-compositor">
      <label htmlFor="stockai-pergunta">Sua pergunta</label>
      <div className="stockai-campo">
        <textarea id="stockai-pergunta" ref={campo} value={rascunho} onChange={evento => setRascunho(evento.target.value)}
          placeholder="Ex.: Qual é o saldo do Papel A4?" rows="2" aria-describedby="stockai-status" />
        <button className="primario botao-destaque" type="button" disabled><ArrowUp size={18} aria-hidden="true" /> Enviar</button>
      </div>
      <p className="muted" id="stockai-status">Envio de mensagens previsto para a Aula 9 (Dia 4 do projeto).</p>
    </div>
  </section>
}
