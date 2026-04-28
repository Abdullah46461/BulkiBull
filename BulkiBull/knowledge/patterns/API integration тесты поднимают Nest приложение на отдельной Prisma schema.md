---
tags:
  - pattern
  - testing
  - api
  - prisma
date: 2026-04-28
project: Bulki Bull
---

# API integration тесты поднимают Nest приложение на отдельной Prisma schema

Когда для `apps/api` нужны быстрые интеграционные тесты без отдельного test runner уровня e2e-фреймворка, удобно поднимать настоящее Nest-приложение и изолировать базу не отдельным контейнером, а временной Prisma schema.

## Паттерн

1. Вынести создание приложения в `apps/api/src/bootstrap.ts`, чтобы `main.ts` и тесты использовали один и тот же `createApp()`.
2. В тесте сгенерировать уникальное имя schema и собрать `DATABASE_URL` с этой schema.
3. Перед тестами выполнить `prisma db push` на эту schema.
4. Поднять приложение через `createApp()` и `app.listen(0)`, чтобы порт выбрался автоматически.
5. После каждого теста очищать таблицы в предсказуемом порядке.
6. После всего набора дропнуть schema целиком.

## Зачем это нужно

- тесты ходят в реальные HTTP endpoints, а не в мокнутые сервисы;
- не трогаются рабочие данные локальной базы;
- Prisma и Nest проверяются вместе, включая guards, controllers и serialization;
- такой набор хорошо подходит для критичного MVP-контура вроде `auth`, `/bulls`, `/weights` и `/feeds`.

## Где смотреть

- `apps/api/src/bootstrap.ts`
- `apps/api/test/api.integration.test.ts`

См. также [[email auth в MVP требует подтверждения почты до входа и использует API_PUBLIC_URL для ссылок]] и сессию [[2026-04-28 email auth, UX ошибок, API тесты и env-документация]].
