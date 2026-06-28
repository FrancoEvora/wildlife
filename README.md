# Caderno de Campo

Aplicativo pessoal para trilhas, registros de vida selvagem, fotografia e segurança em campo.

É um PWA estático: não usa servidor próprio, login, banco externo nem nuvem. Os dados ficam no navegador do aparelho, usando `localStorage` para os dados estruturados e `IndexedDB` para fotos/áudios.

## Novidades desta versão

- Sirene do SOS refeita com áudio pulsante mais forte.
- Pisca-alerta de emergência com tela piscante e tentativa de piscar a lanterna física do celular quando o navegador permitir.
- Visualizador de foto/áudio: agora é possível abrir a foto já registrada tocando na miniatura ou nos botões de mídia.
- Aba **Mapa**, com rota gravada, posição atual, observações e riscos/pontos úteis.
- Exportação **GPX** pela aba Mapa.
- Exportação **CSV** pela aba Observações.
- Lista editável de equipamentos: câmeras, lentes e acessórios.
- Layout renovado, com cards mais limpos, navegação inferior e visual mais premium.

## O que está implementado

- Iniciar e finalizar trilha.
- Gravar rota por GPS, distância aproximada e pontos de localização.
- Registrar avistamentos de fauna/flora, rastros, sons, ninhos/tocas e outros achados.
- Salvar foto de campo e áudio de campo.
- Complementar um registro posteriormente com foto profissional, câmera, lente, acessório, distância focal, configurações e nota posterior.
- Marcar riscos e pontos úteis: trecho escorregadio, ponte ruim, árvore caída, ponto sem sinal, ponto de água etc.
- Biblioteca pessoal com busca e abertura de mídias.
- Mapa interativo online com trilha, registros e riscos.
- Exportação JSON dos dados estruturados.
- Importação JSON dos dados estruturados.
- Tela de SOS com sirene, tela piscante, vibração, tentativa de lanterna, coordenadas e mensagem para copiar/compartilhar.
- Plano rápido de segurança com previsão de retorno, contatos e mensagem padrão.

## Como testar no computador

1. Descompacte a pasta.
2. Abra o terminal dentro da pasta do app.
3. Rode:

```bash
python3 -m http.server 8000
```

4. Abra no navegador:

```text
http://localhost:8000
```

No computador, `localhost` costuma permitir recursos como GPS, service worker e instalação PWA.

## Como usar no celular

Para GPS, instalação PWA e service worker funcionarem bem no celular, abra o app por um endereço HTTPS. Você pode publicar a pasta na Vercel usando GitHub. Veja o passo a passo em `DEPLOY.md`.

Depois de abrir no navegador do celular, use a opção “Adicionar à tela inicial” ou “Instalar app”, quando disponível.

## Observações importantes

- A sirene depende de volume do aparelho, permissões do navegador e contexto de interação do usuário.
- A lanterna física não é garantida em todos os navegadores; por isso o app também usa tela piscante e vibração.
- O mapa usa tiles online. Seus registros continuam locais, mas o fundo do mapa depende de conexão.
- A exportação JSON salva os dados estruturados. As mídias ficam no armazenamento local do navegador.
- Faça backup regularmente e não envie backups, fotos pessoais, GPXs ou CSVs para o GitHub.
- O SOS não chama resgate automaticamente. Ele ajuda a sinalizar, copiar/compartilhar coordenadas e ligar para o contato configurado.

## Arquivos principais

- `index.html`: estrutura do aplicativo.
- `styles.css`: visual responsivo.
- `app.js`: lógica, banco local, GPS, registros, biblioteca, mapa, SOS e exportações.
- `manifest.json`: instalação PWA.
- `sw.js`: cache offline do app.
- `icon.svg`, `icon-192.png`, `icon-512.png`: ícones.
