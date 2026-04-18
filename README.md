# Bulki Bull

MVP мобильного приложения для учета бычков на откорме.

## Текущий статус

Этап 5 завершает MVP-скелет проекта:

- есть npm workspaces монорепозиторий;
- Turbo управляет сборкой, линтингом и typecheck;
- backend реализован на NestJS;
- mobile app реализован на Ionic Vue + Vue 3;
- общий пакет `@bulki-bull/shared` хранит типы, DTO-схемы и утилиты;
- PostgreSQL поднимается через Docker Compose;
- Prisma подключена к backend, есть миграция и seed;
- REST API покрывает бычков, историю взвешиваний и MVP-модуль кормов;
- mobile app умеет список, поиск, карточку, создание, редактирование, добавление веса и экран кормов;
- в header списка бычков показывается компактный остаток кормов по дням;
- фото в MVP работает через поле `photoUrl`.

Production-ready загрузка файлов, авторизация, офлайн-режим и аналитика намеренно не входят в MVP.

## Стек

- Monorepo: npm workspaces
- Orchestration: Turbo
- Backend: Node.js, NestJS, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- API: REST
- Mobile: Ionic Vue, Vue 3, TypeScript, Vite
- Shared: TypeScript package + Zod
- Local infrastructure: Docker Compose

## Структура репозитория

```text
apps/
  api/       NestJS backend API
  mobile/    Ionic Vue mobile app
packages/
  shared/    shared types, DTO schemas and utilities
infra/
  docker/    local Docker notes
  db/        database notes
BulkiBull/   Obsidian vault с проектной памятью
```

В репозитории нет web/admin приложения. Для MVP поддерживаются только `apps/api`, `apps/mobile` и `packages/shared`.

## Требования

- Node.js 20.11+ или 22.x
- npm 10+
- Docker Desktop или совместимый Docker daemon

Локально проект проверялся на Node.js `22.11.0` и npm `10.9.0`.

## Быстрый запуск

Установка зависимостей:

```bash
npm install
```

Поднять PostgreSQL:

```bash
npm run db:up
```

Применить миграции и наполнить тестовыми данными:

```bash
npm run db:migrate
npm run db:seed
```

Запустить API в первом терминале:

```bash
npm run dev -w apps/api
```

Запустить mobile app во втором терминале:

```bash
npm run dev -w apps/mobile
```

Открыть приложение:

```text
http://localhost:5173
```

Важно: `http://localhost:3000` - это API, а `http://localhost:5173` - mobile app. Если `5173` не открывается, значит mobile dev server не запущен или занят другим процессом.

## Environment

Примеры env-файлов:

- `.env.example`
- `apps/api/.env.example`
- `apps/mobile/.env.example`

Для локальной разработки можно создать свои `.env`:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

API-скрипты имеют dev fallback для `DATABASE_URL`, поэтому базовый локальный запуск работает с дефолтной Docker Compose базой.

PostgreSQL по умолчанию:

- host: `localhost`
- port: `5432`
- database: `bulki_bull`
- user: `bulki`
- password: `bulki`

Остановить локальную базу:

```bash
npm run db:down
```

## Архитектура

`apps/api` отвечает за REST API, Prisma и работу с PostgreSQL. Бизнес-логика MVP сейчас сосредоточена в модулях `bulls` и `feeds`.

`apps/mobile` отвечает за пользовательские мобильные сценарии. Приложение общается с backend через `src/services/api.ts`.

`packages/shared` содержит Zod-схемы, TypeScript-типы DTO и общие утилиты вроде расчета возраста. Эти контракты используются и backend, и mobile, чтобы не расходиться в форматах данных.

Единый подход к текущему весу: `currentWeight` вычисляется из последней записи `WeightRecord` по `date`, затем `createdAt`. Если записей веса нет, используется `initialWeight`. Отдельное поле текущего веса в базе не хранится, поэтому MVP не требует синхронизации.

## Backend API

Проверка API:

```bash
curl http://localhost:3000/health
```

Реализованные endpoints:

```text
GET    /bulls
GET    /bulls?search=A-101
GET    /bulls/:id
POST   /bulls
PATCH  /bulls/:id
DELETE /bulls/:id
GET    /bulls/:id/weights
POST   /bulls/:id/weights
GET    /feeds
PUT    /feeds/:type
```

`GET /bulls?search=` выполняет базовый поиск по номеру/бирке.

Пример создания бычка:

```bash
curl -X POST http://localhost:3000/bulls \
  -H "content-type: application/json" \
  -d '{
    "tagNumber": "A-500",
    "name": "Тест",
    "birthDate": "2025-06-01",
    "sex": "MALE",
    "arrivalDate": "2025-12-01",
    "initialWeight": 205
  }'
```

Пример добавления веса:

```bash
curl -X POST http://localhost:3000/bulls/<bullId>/weights \
  -H "content-type: application/json" \
  -d '{
    "date": "2026-04-15",
    "weight": 263.5,
    "comment": "Контрольное взвешивание"
  }'
```

Пример обновления корма:

```bash
curl -X PUT http://localhost:3000/feeds/hay \
  -H "content-type: application/json" \
  -d '{
    "currentStockKg": 1200,
    "consumptionPerBullPerDayKg": 6.5
  }'
```

`GET /feeds` возвращает готовые поля `bullsCount`, `dailyConsumptionKg` и `daysLeft`. Если данных недостаточно или расход равен `0`, расчетные поля возвращаются как `null`.

## Mobile MVP

Реализованные экраны:

- список бычков: `/bulls`;
- корма: `/feeds`;
- карточка бычка: `/bulls/:id`;
- создание бычка: `/bulls/new`;
- редактирование бычка: `/bulls/:id/edit`;
- добавление веса: `/bulls/:id/weights/new`.

Реализованные сценарии:

- просмотр списка;
- поиск по номеру/бирке;
- просмотр карточки с возрастом, текущим весом, характеристиками и заметками;
- создание бычка;
- редактирование бычка;
- добавление веса;
- просмотр истории взвешиваний;
- учет кормов: остаток, расход на голову, расход в день и дни остатка;
- compact summary по кормам в header списка бычков;
- отображение фото по `photoUrl`.

## Фото в MVP

Для MVP выбран самый простой рабочий вариант: поле `photoUrl`.

Сейчас:

- форма создания/редактирования принимает ссылку на фото;
- форма показывает preview;
- список показывает thumbnail, если `photoUrl` заполнен;
- карточка бычка показывает фото в верхнем блоке;
- если фото нет, UI использует fallback с номером бирки.

Как масштабировать позже:

- добавить backend endpoint вроде `POST /uploads/photos`;
- сохранять файл в S3, MinIO или другом object storage;
- возвращать URL или signed URL из upload endpoint;
- сохранять этот URL в существующее поле `Bull.photoUrl`;
- mobile-компоненты отображения почти не менять, потому что они уже работают с URL.

## Quality checks

```bash
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run prisma:validate -w apps/api
```

## TODO для следующей итерации

- TODO: заменить ручной `photoUrl` на реальную загрузку файлов через backend.
- TODO: добавить API-тесты для CRUD и истории веса.
- TODO: добавить e2e smoke-тест mobile flow.
- TODO: добавить pagination или lazy loading для большого списка бычков.
- TODO: улучшить UX ошибок на mobile, когда API недоступен.
- TODO: переключить расчеты кормов на количество активных бычков, когда в модели появятся статусы.
- TODO: если позже понадобится полноценный склад, добавлять движения отдельно, не ломая текущий snapshot-подход `FeedStock`.
- TODO: подготовить production env/deploy notes.
- TODO: обновить Obsidian vault командой `сохрани сессию`, если нужно зафиксировать итоги этапов.
