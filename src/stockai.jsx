import { useRef, useState } from 'react'
import { ArrowUp, CircleAlert, ClipboardList, PackageSearch } from 'lucide-react'

const sugestoes = [
  { Icone: CircleAlert, pergunta: 'Quais produtos atingiram o estoque mínimo?' },
  { Icone: ClipboardList, pergunta: 'Quais foram as últimas movimentações?' },
  { Icone: PackageSearch, pergunta: 'Qual é o saldo do Papel A4?' },
]

function Caixinha({ tamanho }) {
  return <svg width={tamanho} height={tamanho} viewBox="0 0 112 112" fill="none" aria-hidden="true">
    <circle cx="56" cy="56" r="54" fill="#fce8f2" />
    <ellipse cx="54" cy="90" rx="32" ry="5" fill="#eec9df" />
    <g stroke="#54243e" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M26 65c-7 2-9 7-9 10m60-12c9 2 14-4 15-11m-46 30v8h-5m22-8v8h5" />
      <path d="m26 43 14-15h35l10 15v32a7 7 0 0 1-7 7H33a7 7 0 0 1-7-7z" fill="#efa963" />
      <path d="m26 43 14-15h35l10 15z" fill="#ffd297" />
      <path d="m53 28-5 15v8h15v-8l1-15" fill="#ffecbd" />
      <path d="M51 68q5 7 10 0" />
      <path d="M91 41v-4m7 7 3-3" stroke="#a73165" />
    </g>
    <circle cx="45" cy="61" r="2.9" fill="#54243e" />
    <circle cx="67" cy="61" r="2.9" fill="#54243e" />
    <ellipse cx="39" cy="68" rx="4" ry="2.3" fill="#f57d97" />
    <ellipse cx="73" cy="68" rx="4" ry="2.3" fill="#f57d97" />
  </svg>
}

export function StockAI() {
  const [rascunho, setRascunho] = useState('')
  const campo = useRef(null)

  return <section className="card stockai" aria-labelledby="stockai-titulo">
    <header className="stockai-topo">
      <Caixinha tamanho={38} />
      <h2 id="stockai-titulo">Chat do estoque</h2>
      <span className="badge neutro">Prévia da interface</span>
    </header>
    <div className="stockai-conteudo">
      <div className="stockai-boas-vindas">
        <Caixinha tamanho={100} />
        <div className="stockai-balao">
          <p className="sobretitulo">BOAS-VINDAS</p>
          <h3>Oi, eu sou a Caixinha!</h3>
          <p className="muted">Vou ajudar você a encontrar produtos, conferir saldos e consultar movimentações. Enquanto isso, escolha uma pergunta para experimentar o campo de mensagem.</p>
        </div>
      </div>
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
