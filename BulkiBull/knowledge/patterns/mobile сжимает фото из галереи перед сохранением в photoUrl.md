---
tags:
  - pattern
  - mobile
  - photo
date: 2026-04-16
project: Bulki Bull
---

# Mobile сжимает фото из галереи перед сохранением в photoUrl

Когда у проекта еще нет backend upload, mobile может сохранить фото в существующее поле `photoUrl`, если сначала подготовить изображение на клиенте.

## Паттерн

1. Открыть галерею телефона через `@capacitor/camera`.
2. Получить `webPath` выбранной фотографии.
3. Прочитать изображение и нарисовать его на `canvas`.
4. Последовательно уменьшать размер и качество JPEG, пока итоговый `data:image/...` не влезет в лимит shared-схемы.
5. Сохранить уже сжатый `data:image/...` в `photoUrl`.

## Зачем это нужно

- пользователь работает с галереей телефона, а не с ручными ссылками;
- огромный оригинал из фотобиблиотеки не раздувает payload без контроля;
- существующий backend контракт и Prisma schema остаются без миграции;
- preview и карточки продолжают использовать то же поле `photoUrl`.

## Ограничение

Это временный MVP-паттерн до появления upload endpoint. Для production лучше загружать файл на backend/object storage и хранить в `photoUrl` уже обычный URL.

## Где смотреть

- `apps/mobile/src/views/BullFormView.vue`
- `apps/mobile/src/utils/photo.ts`
- `packages/shared/src/index.ts`

См. также [[фото в MVP хранится как photoUrl]].
