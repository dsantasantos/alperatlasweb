# Alper Atlas

Protótipo corporativo do cockpit de movimentação cadastral da Alper, agora estruturado como aplicação React com Vite e Tailwind CSS.

O projeto continua usando dados mockados em memória para validação de produto e UX. Ainda não há backend, banco de dados ou autenticação real.

## Stack

- React
- Vite
- Tailwind CSS
- Inter via `@fontsource/inter`
- CSS modularizado em `src/styles/app.css`
- Firebase Hosting
- Design tokens em `tailwind.config.js`

## Autenticação Simulada

Use as credenciais abaixo para entrar no cockpit:

```txt
Usuário: admin
Senha: 123@456
```

## Estrutura

- `src/main.jsx`: ponto de entrada React.
- `src/App.jsx`: cockpit e dados mockados.
- `src/styles/app.css`: estilos do produto, extraídos do antigo HTML inline.
- `src/assets/alper-atlas-logo.png`: logo usada no app.
- `tailwind.config.js`: tokens iniciais do design system.
- `DESIGN_SYSTEM.md`: direção visual e padrões para evolução.
- `firebase.json`: publica o build `dist`.

## Rodar Localmente

```bash
npm install
npm run dev
```

Depois acesse a URL mostrada pelo Vite.

## Build

```bash
npm run build
npm run preview
```

## Publicar no Firebase Hosting

Pré-requisitos: Node.js e Firebase CLI.

```bash
npm install
npm run build
firebase deploy --only hosting
```

O Firebase está configurado para publicar a pasta `dist`.

## Fontes Sem CDN

O projeto não usa mais Google Fonts por CDN. A fonte Inter é empacotada localmente via `@fontsource/inter`, importada no bundle do Vite.

A pilha de fallback continua definida como `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial` e `sans-serif`.
