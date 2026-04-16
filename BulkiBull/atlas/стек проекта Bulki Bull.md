---
tags:
  - architecture
  - stack
date: 2026-04-15
project: Bulki Bull
---

# Стек проекта Bulki Bull

## Монорепозиторий

- npm workspaces
- Turbo
- TypeScript
- ESLint
- Prettier

## Backend

- Node.js
- NestJS
- REST API
- Prisma ORM
- PostgreSQL

## Mobile

- Ionic Vue
- Vue 3
- Vite
- TypeScript

## Shared

- `@bulki-bull/shared` хранит Zod-схемы, DTO-типы, response-типы и утилиты расчета возраста.
- Backend использует shared-схемы для validation pipe.
- Mobile использует shared-типы и схемы для API-контрактов.

## Локальная инфраструктура

- PostgreSQL запускается через Docker Compose.
- Проверка доступности базы идет через [[health endpoint проверяет подключение Prisma к PostgreSQL]].

См. также [[локальная инфраструктура PostgreSQL через Docker Compose]] и [[shared пакет хранит общие типы и константы]].
