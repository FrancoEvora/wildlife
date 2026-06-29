# Publicação no GitHub + Vercel

Este projeto é um PWA estático. Não precisa de backend, banco externo, login nem variáveis de ambiente.

## 1. Preparar a pasta

Descompacte o ZIP e entre na pasta:

```bash
cd caderno_campo_v3
```

Teste localmente:

```bash
python3 -m http.server 8000
```

Abra:

```text
http://localhost:8000
```

## 2. Criar o repositório no GitHub

Crie um repositório vazio no GitHub, por exemplo:

```text
caderno-de-campo
```

Sugestão: use repositório privado, já que é um app pessoal.

## 3. Enviar os arquivos pelo terminal

Dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "Primeira versão do Caderno de Campo"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/caderno-de-campo.git
git push -u origin main
```

Troque `SEU_USUARIO` pelo seu usuário ou organização do GitHub.

## 4. Publicar na Vercel

1. Entre no painel da Vercel.
2. Clique em **Add New Project** ou **New Project**.
3. Importe o repositório `caderno-de-campo`.
4. Em **Framework Preset**, deixe como **Other** ou sem framework.
5. Não informe build command.
6. Não informe output directory.
7. Clique em **Deploy**.

A Vercel publicará o app em uma URL HTTPS, o que ajuda o PWA, GPS e service worker a funcionarem melhor no celular.

## 5. Como atualizar depois

Edite os arquivos, teste localmente e envie novamente:

```bash
git add .
git commit -m "Ajustes no app"
git push
```

Cada push na branch principal gera novo deploy na Vercel.

## 6. Privacidade e segurança

- Os registros do app ficam no navegador do aparelho, via IndexedDB.
- Não suba backups pessoais, fotos de trilha, CSVs ou GPXs para o GitHub.
- A Vercel publica o app em uma URL acessível pela internet, salvo se você configurar proteção de acesso.
- O arquivo `robots.txt` pede para buscadores não indexarem o app, mas isso não é uma proteção real.
- Faça backup JSON pelo app com frequência e guarde em local seguro.

## 7. Arquivos de publicação

- `index.html`: estrutura do app.
- `styles.css`: visual.
- `app.js`: lógica principal.
- `manifest.json`: instalação PWA.
- `sw.js`: cache offline.
- `vercel.json`: cabeçalhos e ajustes para deploy na Vercel.
- `.gitignore`: evita subir arquivos locais e backups pessoais.
- `robots.txt`: solicita não indexação por buscadores.
