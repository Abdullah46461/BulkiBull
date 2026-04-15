---
tags:
  - infrastructure
  - database
  - docker
date: 2026-04-15
project: Bulki Bull
---

# Локальная инфраструктура PostgreSQL через Docker Compose

Локальная база данных поднимается из корня проекта:

```bash
npm run db:up
```

Остановка:

```bash
npm run db:down
```

Логи:

```bash
npm run db:logs
```

## Параметры по README

- host: `localhost`
- port: `5432`
- database: `bulki_bull`
- user: `bulki`
- password: `bulki`

Эти значения подходят для локальной разработки. Не переносить реальные секреты в Obsidian vault.

## Проверка

API health check делает `SELECT 1` через Prisma. Если Docker-база не запущена или `DATABASE_URL` неверный, `GET /health` должен быстро показать проблему.

См. [[health endpoint проверяет подключение Prisma к PostgreSQL]] и [[проверка health endpoint быстро ловит проблемы PostgreSQL]].
