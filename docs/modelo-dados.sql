-- Futura Casa Pro v3.0 — Modelo de dados recomendado

CREATE TABLE leads (
  id uuid PRIMARY KEY,
  nome text,
  telefone text,
  origem text,
  campanha text,
  cidade text,
  perfil text,
  objetivo text,
  entrada_disponivel numeric,
  parcela_ideal numeric,
  prazo_compra text,
  preferencia_regiao text,
  score_intencao integer,
  probabilidade_fechamento integer,
  status text,
  corretor_responsavel uuid,
  proxima_acao text,
  data_ultima_interacao timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE conversations (
  id uuid PRIMARY KEY,
  lead_id uuid REFERENCES leads(id),
  canal text,
  mensagens jsonb,
  resumo text,
  sentimento text,
  objecoes_detectadas jsonb,
  intencao_detectada text,
  proxima_acao_sugerida text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE products (
  id uuid PRIMARY KEY,
  empreendimento text,
  quadra text,
  unidade text,
  valor numeric,
  metragem numeric,
  status text,
  perfil_ideal jsonb,
  tese_comercial text,
  melhor_argumento text,
  objecao_provavel text,
  liquidez text,
  prioridade text,
  tags jsonb,
  condicoes_permitidas jsonb,
  tempo_estoque_dias integer,
  numero_vezes_ofertado integer,
  visitas_geradas integer,
  propostas_recebidas integer,
  motivo_provavel_nao_conversao text,
  estrategia_recomendada text
);

CREATE TABLE recommendations (
  id uuid PRIMARY KEY,
  lead_id uuid REFERENCES leads(id),
  product_id uuid REFERENCES products(id),
  score_compatibilidade integer,
  motivo_recomendacao text,
  argumento_sugerido text,
  risco_objecao text,
  proxima_acao text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE agent_actions (
  id uuid PRIMARY KEY,
  lead_id uuid REFERENCES leads(id),
  tipo_acao text,
  agente_responsavel text,
  status text,
  resultado text,
  precisa_aprovacao_humana boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE handoffs (
  id uuid PRIMARY KEY,
  lead_id uuid REFERENCES leads(id),
  corretor_id uuid,
  motivo_handoff text,
  resumo_lead text,
  urgencia text,
  proxima_acao text,
  status text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY,
  responsavel uuid,
  lead_id uuid REFERENCES leads(id),
  tipo text,
  prioridade text,
  prazo timestamptz,
  status text,
  resultado text
);

CREATE TABLE objections (
  id uuid PRIMARY KEY,
  lead_id uuid REFERENCES leads(id),
  tipo text,
  intensidade integer,
  origem text,
  resposta_sugerida text,
  status text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE campaign_attribution (
  id uuid PRIMARY KEY,
  lead_id uuid REFERENCES leads(id),
  campanha text,
  canal text,
  custo numeric,
  etapa_alcancada text,
  conversao boolean,
  receita_gerada numeric
);
