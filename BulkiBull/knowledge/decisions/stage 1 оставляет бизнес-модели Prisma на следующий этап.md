---
tags:
  - decision
  - prisma
date: 2026-04-15
project: Bulki Bull
---

# Stage 1 оставляет бизнес-модели Prisma на следующий этап

## Решение

В Stage 1 Prisma подключен к PostgreSQL, но `Bull` и `WeightRecord` еще не описаны в `apps/api/prisma/schema.prisma`.

## Почему

Stage 1 фиксирует foundation: монорепозиторий, API skeleton, mobile skeleton, shared package, Docker Compose, Prisma connection и quality checks. Бизнес-модели перенесены в Stage 2, чтобы сначала стабилизировать инфраструктурный каркас.

## Последствия

- `GET /health` уже может проверять подключение к базе.
- CRUD endpoints еще отсутствуют.
- Mobile пока показывает placeholder.
- Следующий логичный шаг - добавить `Bull` и `WeightRecord`, миграции и seed-данные.

Связано с [[архитектура монорепозитория Bulki Bull]] и [[NestJS API подключается к PostgreSQL через Prisma]].
