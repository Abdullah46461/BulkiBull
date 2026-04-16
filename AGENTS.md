# Инструкции проекта для Codex

## Кратко о проекте

Bulki Bull - это MVP мобильного приложения для учета бычков на откорме. Репозиторий устроен как TypeScript-монорепозиторий с NestJS API, Ionic Vue mobile app, общим пакетом, Prisma, PostgreSQL, Docker Compose, npm workspaces и Turbo.

Текущая реализация - MVP-скелет после Stage 5: backend API для бычков и истории веса, мобильные MVP-экраны, shared DTO/types/Zod-схемы, Prisma-модели, миграция, seed и простая работа с фото через `photoUrl`. Production-ready загрузка файлов, авторизация, офлайн-режим и расширенная аналитика пока намеренно оставлены в TODO.

## Obsidian Knowledge Vault

Память проекта хранится в Obsidian vault по адресу:

`/Users/abdullabeterbiev/Desktop/bulki bull/BulkiBull`

Этот vault - адаптация workflow из брошюры `CLAUDE.md + Obsidian Vault` под Codex. Используй `AGENTS.md` как слой проектных инструкций, а vault - как долгосрочную память проекта.

### В начале нетривиальной работы

Сначала прочитай эти заметки:

1. `BulkiBull/00-home/index.md`
2. `BulkiBull/00-home/текущие приоритеты.md`

Затем прочитай релевантные заметки из:

- `BulkiBull/atlas/` - архитектура, стек, база данных, деплой и инфраструктурный контекст.
- `BulkiBull/knowledge/decisions/` - почему были приняты прошлые решения.
- `BulkiBull/knowledge/patterns/` - устоявшиеся паттерны реализации.
- `BulkiBull/knowledge/debugging/` - известные проблемы, сбои и способы их исправления.
- `BulkiBull/knowledge/business/` - продуктовый и доменный контекст.
- `BulkiBull/knowledge/integrations/` - внешние системы, API и контекст интеграции с базой данных.

Исходный код остается главным источником истины. Если заметка и код противоречат друг другу, проверь код и обнови заметку, когда пользователь попросит сохранить сессию.

### Когда пользователь говорит "сохрани сессию"

1. Создай заметку с датой в `BulkiBull/sessions/`.
2. Обнови `BulkiBull/00-home/текущие приоритеты.md`.
3. Добавь или обнови заметку в `knowledge/decisions/`, если было принято архитектурное или продуктовое решение.
4. Добавь или обнови заметку в `knowledge/debugging/`, если был найден баг или известный сценарий сбоя.
5. Добавь или обнови заметку в `knowledge/patterns/`, если появился переиспользуемый паттерн кода.
6. Обнови `BulkiBull/00-home/index.md`, если добавлены новые важные заметки.

### Правила ведения vault

- Пиши заметки на русском, если пользователь не попросил иначе.
- Используй wiki-ссылки между связанными заметками, например `[[архитектура монорепозитория Bulki Bull]]`.
- Называй заметки утверждениями, а не размытыми категориями.
- Держи `00-home/index.md` достаточно коротким для быстрого просмотра; детали выноси в отдельные заметки.
- Не храни во vault секреты, API keys, приватные credentials или персональные данные.
- Не редактируй `BulkiBull/.obsidian/`, если пользователь явно не попросил изменить настройки Obsidian.

## Частые команды

Установка зависимостей:

```bash
npm install
```

Запуск локального PostgreSQL:

```bash
npm run db:up
```

Миграции и seed:

```bash
npm run db:migrate
npm run db:seed
```

Запуск API:

```bash
npm run dev -w apps/api
```

Запуск mobile app:

```bash
npm run dev -w apps/mobile
```

Проверки качества:

```bash
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run prisma:validate -w apps/api
```

## Инженерные заметки

- Код API держи в `apps/api`, mobile UI - в `apps/mobile`, общие DTO/types/constants - в `packages/shared`.
- API предоставляет `GET /health`, REST endpoints `/bulls` и `/bulls/:id/weights`.
- Prisma schema содержит модели `Bull` и `WeightRecord`, а также enum `BullSex`.
- Текущий вес в MVP вычисляется из последней записи `WeightRecord`; отдельное поле текущего веса в базе не хранится.
- Фото в MVP хранится как `photoUrl`; реальную загрузку файлов нужно добавлять отдельным следующим этапом.
- Лучше добавлять общие контракты в `packages/shared`, чем дублировать типы между API и mobile.
