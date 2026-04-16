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
- `packages/shared/` - общие DTO/schema-контракты, типы и утилиты.
- `infra/db/` - заметки по базе данных.
- `infra/docker/` - заметки по локальной Docker-инфраструктуре.
- `BulkiBull/` - Obsidian knowledge vault для Codex.

## Текущее состояние

Этапы 1-5 завершены. В `apps/api` есть модуль `bulls`, Prisma-модели `Bull` и `WeightRecord`, миграция, seed и REST endpoints для списка, карточки, создания, редактирования и истории веса.

В `apps/mobile` есть Ionic Vue screens для списка, поиска по бирке, карточки, создания, редактирования и добавления веса. Фото в MVP работает через `photoUrl`, см. [[фото в MVP хранится как photoUrl]].

## Как развивать

Новые бизнес-контракты лучше сначала проектировать как shared Zod schemas и TypeScript types в `packages/shared`, затем использовать их в `apps/api` и `apps/mobile`. Это снижает риск расхождения API и клиента.

См. также [[npm workspaces и turbo управляют монорепозиторием]], [[shared пакет хранит общие типы и константы]] и [[текущий вес вычисляется из последней записи взвешивания]].
