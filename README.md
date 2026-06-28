# Caderno de Campo

Aplicativo pessoal para trilhas, registros de vida selvagem, fotografia e segurança em campo.

Esta primeira versão é um PWA estático: não usa servidor próprio, login, banco externo nem nuvem. Os dados ficam no navegador do aparelho, usando IndexedDB.

## O que já está implementado

- Iniciar e finalizar trilha.
- Gravar rota por GPS, distância aproximada e pontos de localização.
- Registrar avistamentos de fauna/flora, rastros, sons, ninhos/tocas e outros achados.
- Salvar foto de campo, áudio de campo e foto profissional complementar.
- Complementar um registro posteriormente pela Biblioteca, incluindo nova foto profissional, nota posterior e dados de câmera.
- Marcar riscos e pontos úteis: trecho escorregadio, ponte ruim, árvore caída, ponto sem sinal, ponto de água etc.
- Biblioteca pessoal com busca e filtros.
- Exportação de backup JSON com dados e mídias.
- Importação de backup JSON.
- Exportação CSV das observações.
- Exportação GPX das trilhas com pontos GPS.
- Tela de SOS com sirene, tela piscante, vibração, tentativa de lanterna, coordenadas e mensagem para copiar/compartilhar.
- Plano rápido de segurança com previsão de retorno, contatos e mensagem padrão.
- Funcionamento offline depois de instalado/carregado em HTTPS ou localhost.

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

Para GPS, instalação PWA e service worker funcionarem bem no celular, o ideal é abrir o app por um endereço HTTPS. Você pode publicar a pasta na Vercel usando GitHub. Veja o passo a passo em `DEPLOY.md`.

Depois de abrir no navegador do celular, use a opção “Adicionar à tela inicial” ou “Instalar app”, quando disponível.

## Publicação

O pacote já inclui arquivos úteis para GitHub + Vercel:

- `vercel.json`: cabeçalhos e configuração simples para publicação estática.
- `.gitignore`: evita subir configurações locais e backups exportados pelo app.
- `robots.txt`: pede para buscadores não indexarem o app.
- `DEPLOY.md`: passo a passo de publicação.

## Observações importantes de segurança

- O SOS não chama resgate automaticamente.
- Compartilhar localização depende de sinal, permissão do navegador e apps disponíveis no aparelho.
- A lanterna física do celular nem sempre pode ser controlada pelo navegador; por isso o app também usa tela piscante, sirene e vibração.
- O app ajuda no registro e sinalização, mas não substitui planejamento, equipamento adequado, bateria externa, mapa confiável, guia local ou contato com serviços oficiais.
- Faça backup JSON com frequência. Se você limpar os dados do navegador ou trocar de aparelho sem backup, os registros locais podem ser perdidos.
- Não envie backups, fotos pessoais, GPXs ou CSVs para o GitHub.

## Arquivos principais

- `index.html`: estrutura do aplicativo.
- `styles.css`: visual responsivo.
- `app.js`: lógica, banco local, GPS, registros, biblioteca, SOS e exportações.
- `manifest.json`: instalação PWA.
- `sw.js`: cache offline do app.
- `icon.svg`, `icon-192.png`, `icon-512.png`: ícones.

## Próximas melhorias sugeridas

- Mapa offline real com tiles baixados previamente.
- Reconhecimento de espécies por imagem/áudio.
- Relatório pós-trilha em PDF.
- Replay visual da trilha com fotos no mapa.
- Check-in automático mais avançado com integração nativa.
- Versão nativa Android/iOS para acesso mais confiável a lanterna, SMS e sensores.
