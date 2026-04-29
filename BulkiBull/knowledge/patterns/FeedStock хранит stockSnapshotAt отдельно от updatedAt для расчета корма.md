---
tags:
  - pattern
  - api
  - prisma
  - shared
  - feed
date: 2026-04-29
project: Bulki Bull
---

# FeedStock хранит stockSnapshotAt отдельно от updatedAt для расчета корма

Когда остаток корма хранится как snapshot, для расчета периода и расчетного текущего остатка лучше иметь отдельный business timestamp `stockSnapshotAt`, а не использовать для этого `updatedAt`.

## Паттерн

1. Сохранять в `FeedStock` введенные пользователем `currentStockKg` и `consumptionPerBullPerDayKg` вместе с `stockSnapshotAt`.
2. Оставлять `updatedAt` техническим timestamp, который не участвует в бизнес-формуле.
3. Вынести чистый расчет `dailyConsumptionKg -> remainingStockKg -> daysLeft -> depletionDate` в `packages/shared`.
4. В API считать сохраненный period и расчетный остаток от `stockSnapshotAt`, а не от времени чтения записи.
5. Возвращать `stockSnapshotAt` в `FeedResponse`, чтобы клиент и отладка видели точку отсчета явно.
6. Проверять интеграционным тестом сценарий "вчера сохранили, сегодня открыли", чтобы дата окончания не уезжала вперед.

## Зачем это нужно

- дата окончания корма перестает дрейфовать;
- бизнес-смысл snapshot становится явным в модели Prisma и API-контракте;
- легче отлаживать уведомления и предупреждения по корму;
- проще эволюционировать модель к журналу движений или раздельным полям snapshot и расчетного остатка.

## Где смотреть

- `apps/api/prisma/schema.prisma`
- `apps/api/src/feeds/feeds.service.ts`
- `packages/shared/src/index.ts`
- `apps/api/test/api.integration.test.ts`

См. также [[остаток корма привязывается к явной дате снимка stockSnapshotAt]] и сессию [[2026-04-29 список бычков и привязка остатка корма к stockSnapshotAt]].
