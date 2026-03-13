CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  rastreio TEXT,
  usuario TEXT,
  nome TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  tamanho TEXT,
  endereco TEXT,
  status TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);