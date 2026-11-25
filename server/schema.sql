CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY,
  nome varchar(120) NOT NULL CHECK (length(trim(nome)) > 0),
  categoria varchar(80) NOT NULL CHECK (length(trim(categoria)) > 0),
  descricao varchar(1000) NOT NULL DEFAULT '',
  quantidade integer NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  minimo integer NOT NULL DEFAULT 0 CHECK (minimo >= 0),
  preco numeric(10,2) NOT NULL CHECK (preco >= 0),
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS perfil (
  id integer PRIMARY KEY CHECK (id = 1),
  nome varchar(120) NOT NULL CHECK (length(trim(nome)) > 0),
  alertas boolean NOT NULL DEFAULT true
);
INSERT INTO perfil (id, nome) VALUES (1, 'Operador demo') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS movimentacoes (
  id uuid PRIMARY KEY,
  produto_id uuid NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  produto_nome varchar(120) NOT NULL,
  tipo varchar(7) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade integer NOT NULL CHECK (quantidade > 0),
  data date NOT NULL,
  observacao varchar(255) NOT NULL DEFAULT '',
  responsavel varchar(120) NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS movimentacoes_produto_data ON movimentacoes(produto_id, data);
CREATE INDEX IF NOT EXISTS movimentacoes_ordem ON movimentacoes(criado_em DESC, id);
