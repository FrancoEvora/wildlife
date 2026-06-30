# Endpoints e serviços internos

## Lead intake
POST /api/leads/intake
- Recebe leads de WhatsApp, formulário, landing page, Meta Ads, Instagram, Google Ads e cadastro manual.

## Agente SDR
POST /api/agents/sdr/qualify
- Qualifica lead, detecta intenção, objeção, score e próxima ação.

## Recomendação
POST /api/recommendations/generate
- Cruza lead com estoque disponível e retorna até 3 produtos compatíveis.

## Handoff
POST /api/handoffs/create
- Cria transferência inteligente para corretor com resumo e urgência.

## Follow-up
POST /api/followups/run
- Gera follow-up contextual por estágio e perfil.

## Torre de controle
GET /api/control-tower/priorities
- Retorna prioridades do dia, alertas e gargalos.

## Objeções
GET /api/objections/weekly-report
- Relatório semanal com objeções recorrentes e impacto no funil.

## Estoque
GET /api/products/intelligence
- Retorna produtos com alertas de baixa oferta, baixa conversão, preço/narrativa.

## Forecast
GET /api/forecast/monthly
- Projeção de vendas prováveis, possíveis, risco e VGV provável.
