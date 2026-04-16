---
tags:
  - debugging
  - mobile
  - vite
date: 2026-04-15
project: Bulki Bull
---

# Localhost 5173 открывается только при запущенном mobile dev server

Если пользователь запускает только:

```bash
npm run dev -w apps/api
```

то `http://localhost:5173` не обязан открываться. Этот порт обслуживает Vite mobile app, а API работает на `http://localhost:3000`.

## Правильный локальный запуск

В первом терминале:

```bash
npm run dev -w apps/api
```

Во втором терминале:

```bash
npm run dev -w apps/mobile
```

После этого:

- API: `http://localhost:3000`
- mobile app: `http://localhost:5173`

## Быстрая проверка

```bash
curl http://localhost:3000/health
curl -I http://localhost:5173
```
