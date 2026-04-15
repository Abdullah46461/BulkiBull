---
tags:
  - pattern
  - api
  - prisma
date: 2026-04-15
project: Bulki Bull
---

# Health endpoint проверяет подключение Prisma к PostgreSQL

`apps/api/src/health.controller.ts` реализует `GET /health`.

Endpoint делает:

```ts
await this.prisma.$queryRaw`SELECT 1`;
```

Затем возвращает:

```json
{
  "status": "ok",
  "service": "api",
  "database": "ok"
}
```

## Почему это полезно

Health check проверяет не только то, что процесс API запущен, но и то, что Prisma реально может выполнить запрос к PostgreSQL.

См. [[NestJS API подключается к PostgreSQL через Prisma]] и [[проверка health endpoint быстро ловит проблемы PostgreSQL]].
