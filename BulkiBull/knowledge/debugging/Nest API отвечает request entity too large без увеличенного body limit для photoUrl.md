---
tags:
  - debugging
  - api
  - mobile
  - photo
date: 2026-04-17
project: Bulki Bull
---

# Nest API отвечает request entity too large без увеличенного body limit для photoUrl

Если mobile уже показал preview выбранного фото, но сохранение бычка падает с `request entity too large`, проблема может быть не в `@capacitor/camera` и не в shared Zod-схеме, а в default body parser limit у Nest/Express.

## Почему это происходит

В текущем MVP `photoUrl` временно хранит сжатый `data:image/...`. Mobile ужимает изображение до лимита `PHOTO_DATA_URL_MAX_LENGTH`, но стандартный JSON parser на API может отклонить весь request раньше, чем тело дойдет до controller и validation pipe.

## Как чинить

- в `apps/api/src/main.ts` поднять приложение как `NestExpressApplication`;
- настроить `app.useBodyParser('json', { limit: ... })`;
- настроить `app.useBodyParser('urlencoded', { limit: ..., extended: true })`;
- брать лимит не из головы, а с запасом относительно shared-константы `PHOTO_DATA_URL_MAX_LENGTH`.

Так backend и mobile не расходятся по допустимому размеру временного фото.

## Где смотреть

- `apps/api/src/main.ts`
- `packages/shared/src/index.ts`
- `apps/mobile/src/utils/photo.ts`
- `apps/mobile/src/views/BullFormView.vue`

См. также [[фото в MVP хранится как photoUrl]].
