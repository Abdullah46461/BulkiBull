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
- добавлена авторизация через email/password с подтверждением почты;
- mobile app умеет список, поиск, карточку, создание, редактирование, добавление веса и экран кормов;
- в header списка бычков показывается компактный остаток кормов по дням;
- фото в MVP работает через поле `photoUrl`.

Production-ready загрузка файлов, офлайн-режим и аналитика намеренно не входят в MVP.

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

Полный локальный сценарий без догадок:

1. Установить зависимости:

```bash
npm install
```

2. Создать локальные env-файлы:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

3. Поднять PostgreSQL:

```bash
npm run db:up
```

4. Применить миграции:

```bash
npm run db:migrate
```

5. Наполнить базу demo-данными:

```bash
npm run db:seed
```

6. Запустить API в первом терминале:

```bash
npm run dev -w apps/api
```

7. Запустить mobile app во втором терминале:

```bash
npm run dev -w apps/mobile
```

8. Открыть mobile app:

```text
http://localhost:5173
```

Важно:

- `http://localhost:3000` - это API.
- `http://localhost:5173` - это mobile app.
- если Vite занял другой порт, он покажет новый адрес в терминале;
- если меняется порт API, обновите `VITE_API_URL` в `apps/mobile/.env`;
- если verification link должен вести не на `localhost:3000`, обновите `API_PUBLIC_URL` в `apps/api/.env`.

Остановить локальную базу:

```bash
npm run db:down
```

## Environment

### `apps/api/.env`

Рекомендуемый локальный шаблон:

```env
PORT=3000
DATABASE_URL="postgresql://bulki:bulki@localhost:5432/bulki_bull?schema=public"
AUTH_SESSION_TTL_DAYS=30
API_PUBLIC_URL=http://localhost:3000
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=1440
SMTP_PROVIDER=
EMAIL_FROM="Bulki Bull <your-address@example.com>"
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASSWORD=
```

Что означает каждая переменная:

- `PORT` - порт API;
- `DATABASE_URL` - строка подключения Prisma к PostgreSQL;
- `AUTH_SESSION_TTL_DAYS` - сколько дней живет сессия после входа;
- `API_PUBLIC_URL` - базовый URL, который попадает в ссылку подтверждения почты;
- `EMAIL_VERIFICATION_TOKEN_TTL_MINUTES` - срок жизни verification link в минутах;
- `SMTP_PROVIDER` - готовый пресет `gmail`, `yandex` или `mailru`, либо пусто для ручной настройки SMTP;
- `EMAIL_FROM` - адрес отправителя;
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASSWORD` - ручная SMTP-конфигурация.

Замечания по `DATABASE_URL`:

- по умолчанию проект ожидает PostgreSQL на `localhost:5432`;
- database: `bulki_bull`;
- user: `bulki`;
- password: `bulki`;
- `schema=public` должна оставаться в URL, если вы не используете отдельную schema вручную.

API умеет стартовать и без файла `apps/api/.env`, потому что в `src/env.ts` есть dev fallback для `PORT`, `DATABASE_URL`, `AUTH_SESSION_TTL_DAYS`, `API_PUBLIC_URL` и `EMAIL_VERIFICATION_TOKEN_TTL_MINUTES`. Но для понятного запуска лучше все равно создать `apps/api/.env`.

### `apps/mobile/.env`

Локальный шаблон:

```env
VITE_API_URL=http://localhost:3000
```

`VITE_API_URL` должен указывать на живой API. Если вы поднимаете API на другом порту или другом хосте, обновите это значение.

## Demo-flow

После `npm run db:seed` в базе появляется demo-аккаунт:

- почта: `demo@bulki.local`
- пароль: `bulki-demo-2026`

Этот аккаунт уже подтвержден и подходит для быстрого smoke-check без регистрации.

Если вы хотите проверить полный сценарий email-auth:

1. зарегистрируйте новый email, которого еще нет в базе;
2. подтвердите почту по ссылке;
3. вернитесь в приложение и войдите с тем же паролем.

### SMTP для подтверждения почты

Регистрация через email требует отправки verification link. Если SMTP не настроен, API не отправляет письмо, а печатает ссылку подтверждения в лог dev-сервера.

Поддерживаются SMTP-пресеты:

- `gmail` → `smtp.gmail.com`, порт `587`, STARTTLS;
- `yandex` → `smtp.yandex.ru`, порт `465`, SSL/TLS;
- `mailru` → `smtp.mail.ru`, порт `465`, SSL/TLS.

В `apps/api/.env` можно указать один из пресетов:

```env
SMTP_PROVIDER=gmail
EMAIL_FROM="Bulki Bull <your-address@gmail.com>"
SMTP_USER=your-address@gmail.com
SMTP_PASSWORD=your-app-password
```

```env
SMTP_PROVIDER=yandex
EMAIL_FROM="Bulki Bull <your-address@yandex.ru>"
SMTP_USER=your-address@yandex.ru
SMTP_PASSWORD=your-app-password
```

```env
SMTP_PROVIDER=mailru
EMAIL_FROM="Bulki Bull <your-address@mail.ru>"
SMTP_USER=your-address@mail.ru
SMTP_PASSWORD=your-app-password
```

Для Gmail, Яндекс и Mail.ru нужен пароль приложения/внешнего приложения, а не обычный пароль от почтового ящика. Для Mail.ru также нужно включить доступ по IMAP/POP/SMTP во внешних сервисах.

Если нужен другой SMTP-сервер, оставьте `SMTP_PROVIDER` пустым и задайте вручную:

```env
EMAIL_FROM="Bulki Bull <no-reply@example.com>"
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=smtp-login
SMTP_PASSWORD=smtp-password
```

Как проверять подтверждение почты:

1. Зарегистрируйте новый email в приложении.
2. Если SMTP настроен, проверьте входящие и папку spam.
3. Если SMTP не настроен, откройте терминал, где запущен `npm run dev -w apps/api`, и найдите строку вида:

```text
SMTP is not configured. Verification link for user@example.com: http://localhost:3000/auth/verify-email?token=...
```

4. Откройте эту ссылку в браузере.
5. После страницы `Почта подтверждена` вернитесь в приложение и выполните вход.

Если письмо не приходит:

- проверьте, что `SMTP_USER`, `SMTP_PASSWORD` и `EMAIL_FROM` заполнены;
- для Gmail, Яндекс и Mail.ru используйте пароль приложения, а не обычный пароль;
- проверьте, что `API_PUBLIC_URL` указывает на адрес, который реально открывается в браузере;
- посмотрите, не попало ли письмо в spam;
- если API вернул `Не удалось отправить письмо подтверждения...`, проверьте SMTP credentials.

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
POST   /auth/register
GET    /auth/verify-email
POST   /auth/verify-email/resend
POST   /auth/login
GET    /auth/me
POST   /auth/logout
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

Все endpoints `/bulls` и `/feeds` требуют заголовок `Authorization: Bearer <token>`.

Для ручной проверки из `curl` сначала получите токен через `/auth/login`, затем подставьте его в `Authorization`.

`GET /bulls?search=` выполняет базовый поиск по номеру/бирке.

Пример создания бычка:

```bash
curl -X POST http://localhost:3000/bulls \
  -H "Authorization: Bearer <token>" \
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
  -H "Authorization: Bearer <token>" \
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
  -H "Authorization: Bearer <token>" \
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
npm run test:api
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run prisma:validate -w apps/api
```

## TODO для следующей итерации

- TODO: заменить ручной `photoUrl` на реальную загрузку файлов через backend.
- TODO: добавить e2e smoke-тест mobile flow.
- TODO: добавить pagination или lazy loading для большого списка бычков.
- TODO: улучшить UX ошибок на mobile, когда API недоступен.
- TODO: переключить расчеты кормов на количество активных бычков, когда в модели появятся статусы.
- TODO: если позже понадобится полноценный склад, добавлять движения отдельно, не ломая текущий snapshot-подход `FeedStock`.
- TODO: подготовить production env/deploy notes.
- TODO: обновить Obsidian vault командой `сохрани сессию`, если нужно зафиксировать итоги этапов.
