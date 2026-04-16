---
tags:
  - integration
  - api
  - prisma
  - postgresql
date: 2026-04-15
project: Bulki Bull
---

# NestJS API подключается к PostgreSQL через Prisma

API использует `PrismaModule` и `PrismaService`.

`PrismaService` наследуется от `PrismaClient` и подключается при старте NestJS-модуля:

```ts
async onModuleInit(): Promise<void> {
  await this.$connect();
}
```

При уничтожении модуля соединение закрывается через `$disconnect()`.

## Где смотреть

- `apps/api/src/prisma/prisma.module.ts`
- `apps/api/src/prisma/prisma.service.ts`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/bulls/bulls.service.ts`
- `apps/api/src/bulls/bulls.controller.ts`

## Связанные заметки

- [[локальная инфраструктура PostgreSQL через Docker Compose]]
- [[health endpoint проверяет подключение Prisma к PostgreSQL]]
- [[текущий вес вычисляется из последней записи взвешивания]]
