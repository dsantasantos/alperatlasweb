# Alper Atlas Design System

Este projeto agora centraliza os tokens principais no `tailwind.config.js` e mantém os componentes legados no `src/styles/app.css`.

## Tokens Base

- Cores de marca: `alper.navy`, `alper.blue`, `alper.green`, `alper.teal`.
- Cores operacionais: `alper.rose` para erro/rejeição e `alper.amber` para avisos.
- Superfícies: branco para painéis, `alper.background` para áreas de trabalho e `alper.line` para divisórias.
- Tipografia: Inter empacotada via `@fontsource/inter`, com fallback local/sistema `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`, `sans-serif`.
- Raio: `control` para botões/filtros e `panel` para painéis compactos.

## Direção

O padrão visual deve continuar denso, operacional e claro para uso repetido por analistas. Telas futuras devem priorizar navegação previsível, tabelas escaneáveis, estados explícitos, auditoria visível e ações primárias bem localizadas.

## Fontes Sem CDN

Para evitar Google Fonts, a fonte Inter é importada pelo bundle do Vite usando `@fontsource/inter`. Não use `<link>` para Google Fonts nem Tailwind por CDN em telas futuras.
