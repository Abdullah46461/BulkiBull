---
tags:
  - debugging
  - api
  - database
date: 2026-04-15
project: Bulki Bull
---

# Проверка health endpoint быстро ловит проблемы PostgreSQL

Если API стартует, но база недоступна, `GET /health` должен упасть на Prisma-запросе `SELECT 1`.

## Быстрая диагностика

1. Проверить, поднята ли база:

```bash
npm run db:up
```

2. Запустить API:

```bash
npm run dev -w apps/api
```

3. Проверить health:

```bash
curl http://localhost:3000/health
```

## Частые причины

- Docker Desktop не запущен.
- PostgreSQL container еще не готов.
- `DATABASE_URL` отличается от локального compose-набора.
- Prisma client не сгенерирован после install или изменения schema.

Связано с [[локальная инфраструктура PostgreSQL через Docker Compose]].
