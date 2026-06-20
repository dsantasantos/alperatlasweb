# Alper Atlas — Protótipo do Cockpit de Movimentação

Protótipo navegável do **Alper Atlas** (cockpit de movimentação cadastral), com identidade
visual da Alper e **dados simulados (mockados)** para validação com usuários.

Site estático, **100% offline** (sem CDN): React vem embutido na própria pasta e o app já
está pré-compilado. Não há backend — todas as ações (triagem, edição, aprovar/rejeitar,
exportar, proveniência, retorno da operadora/seguradora) rodam no navegador, em memória.

## Arquivos
- `index.html` — página principal.
- `app.js` — aplicação (React já compilado para JS puro).
- `react.production.min.js` / `react-dom.production.min.js` — React embutido (sem CDN).
- `alper-atlas-logo.png` — logo (tela de entrada e favicon).
- `firebase.json` — configuração de hosting.

> Mantenha todos os arquivos juntos na mesma pasta.

## Rodar localmente
Sirva a pasta por HTTP (abrir com file:// bloqueia o carregamento dos scripts/imagens):

    npx serve .
    # ou
    python3 -m http.server 5000

Depois acesse o endereço mostrado no terminal. Se a tela ficar branca, abra o console
do navegador (F12) — mas, sem CDN, isso não deve mais acontecer.

## Publicar no Firebase Hosting
Pré-requisitos: Node.js e Firebase CLI (`npm install -g firebase-tools`).

1. `firebase login`
2. (Primeira vez) `firebase use --add` e selecione seu projeto Firebase (cria o `.firebaserc`).
3. `firebase deploy --only hosting`

A CLI mostrará a URL pública (ex.: `https://SEU-PROJETO.web.app`).

> O `firebase.json` já aponta o hosting para esta pasta (`"public": "."`).
> Não rode `firebase init hosting` por cima, ou ele pode sobrescrever a configuração —
> apenas `firebase use --add` e `firebase deploy`.

## Notas
- O app foi pré-compilado (sem Babel no navegador), o que torna o carregamento rápido e robusto.
- Para editar o código-fonte (JSX) depois, peça a versão `app.jsx` e recompile com Babel/Vite.
- Identidade: verde Alper #06805B, azul-marinho do logo #143D6B, teal #2C7A93.
- Conceito de destino: **Operadora / Seguradora**.
