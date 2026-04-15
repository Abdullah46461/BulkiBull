---
tags:
  - architecture
  - monorepo
date: 2026-04-15
project: Bulki Bull
---

# Архитектура монорепозитория Bulki Bull

Bulki Bull организован как npm workspaces монорепозиторий. Корень отвечает за общие scripts, Turbo orchestration, Docker Compose и общую конфигурацию TypeScript/ESLint/Prettier.

## Основные зоны

- `apps/api/` - NestJS backend API.
- `apps/mobile/` - Ionic Vue mobile app на Vue 3 и Vite.
- `packages/shared/` - общие типы, константы и будущие DTO/schema-контракты.
- `infra/db/` - заметки по базе данных.
- `infra/docker/` - заметки по локальной Docker-инфраструктуре.
- `BulkiBull/` - Obsidian knowledge vault для Codex.

## Текущее состояние

Сейчас реализован foundation stage: API имеет health check, mobile показывает placeholder, Prisma подключен к PostgreSQL, но бизнес-модели еще не добавлены. Это связано с решением [[stage 1 оставляет бизнес-модели Prisma на следующий этап]].

## Как развивать

Новые бизнес-контракты лучше сначала проектировать как shared types/DTO в `packages/shared`, затем использовать их в `apps/api` и `apps/mobile`. Это снижает риск расхождения API и клиента.

См. также [[npm workspaces и turbo управляют монорепозиторием]] и [[shared пакет хранит общие типы и константы]].
