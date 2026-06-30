# Futura Casa Pro v2.3 — Ajustes aplicados com identidade v1.1

Esta versão parte diretamente do pacote **Futura Casa Pro v1.1 Clean Flow** e preserva sua identidade:

- logomarca original extraída da v1.1 (`assets/futura-casa-logo-v1-1.webp`);
- fundo escuro em gradiente com terracota + teal;
- classes visuais `fcClean*` da v1.1;
- `pro-clean.css` e `pro-clean.js` originais preservados;
- index da v1.1 preservado como base da experiência de vendas.

Ajustes realizados:
- inclusão de links reais para Gestão, Pós-venda e Ocorrências no topo do modo Pro;
- criação de `gestao.html` com painel de gestão no mesmo visual da v1.1;
- criação de `pos-venda.html` com modo Minha Obra/pós-venda no mesmo visual da v1.1;
- criação de `ocorrencias.html` com registro de ocorrência no mesmo visual da v1.1;
- criação de `pro-modules.css` e `pro-modules.js`;
- preservação dos arquivos originais de corretores, wellness, backoffice, blogs e mapas;
- manutenção da hierarquia de botões: primário, secundário e ghost.

Arquivos novos:
- `gestao.html`
- `pos-venda.html`
- `ocorrencias.html`
- `pro-modules.css`
- `pro-modules.js`
- `assets/futura-casa-logo-v1-1.webp`


## v2.4 — Ajustes finais solicitados

Correções aplicadas:
- Removidos textos de racional interno para usuário final, como “menos poluição”, “AR no momento certo” e “IA quando faz sentido”.
- Modo Vendas agora exibe a logomarca real da versão Pro 1.1 no topo.
- Menu superior de Vendas/Gestão/Pós-venda/Ocorrências foi reorganizado para não sobrepor em mobile.
- Botões de imagem, rota, AR e simulação foram padronizados com uma hierarquia consistente:
  - primário sólido para avanço;
  - secundário outline para apoio;
  - ghost para ações exploratórias.
- Faixa/resumo inferior foi reformatada como “Resumo da escolha”, com linhas e botões consistentes.
- Ocorrências agora usam geolocalização do aparelho para registrar o ponto real da ocorrência.
- Pós-venda agora possui duas camadas:
  - Obras do loteamento;
  - Obras da casa.
