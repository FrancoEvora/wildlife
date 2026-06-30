# Testes de fluxo

## Teste 1 — Lead família alta intenção
Entrada: família, morar, entrada 120 mil, parcela 4,5 mil, prazo 30 dias.
Esperado: alta intenção, recomendação de lote disponível, próxima ação agendar visita ou corretor.

## Teste 2 — Lead investidor
Entrada: investir, liquidez, entrada 90 mil, parcela 3,5 mil.
Esperado: perfil investidor, argumento de valorização/liquidez, follow-up com tese de investimento.

## Teste 3 — Lead construtor
Entrada: construir, frente, metragem, implantação.
Esperado: perfil construtor, recomendação por metragem/frente, argumento técnico.

## Teste 4 — Produto indisponível
Produtos reservados ou vendidos não podem aparecer nas recomendações.

## Teste 5 — Handoff
Lead com score maior que 78 deve gerar handoff com corretor disponível e contexto completo.

## Teste 6 — Follow-up
Lead com atendimento humano ativo deve pausar automação.

## Teste 7 — Gestão
Gestor deve ver prioridades do dia e alertas de estoque/lead.
