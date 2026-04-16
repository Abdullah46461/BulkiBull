---
tags:
  - decision
  - photo
  - mvp
date: 2026-04-16
project: Bulki Bull
---

# Фото в MVP хранится как photoUrl

В MVP фото бычка хранится как строковое поле `Bull.photoUrl`. Это поле намеренно не меняло Prisma schema, даже когда mobile flow ушел от ручного `URL` к выбору фото из галереи.

Сейчас `photoUrl` может содержать:

- внешний `http/https` URL;
- временный `data:image/...` после выбора фото из галереи на mobile.

## Почему так

Это по-прежнему минимально рабочий вариант без преждевременного file storage. Он позволяет:

- сохранить единый backend/mobile контракт;
- не трогать Prisma schema и API shape ради MVP;
- дать mobile-пользователю естественный сценарий выбора фото из галереи, даже пока нет upload endpoint.

Для mobile это временное решение: приложение сжимает изображение и сохраняет его в `photoUrl` как `data:image/...`, чтобы экран создания/редактирования, список и карточка работали сразу.

## Как масштабировать

Следующий шаг - добавить backend endpoint вроде `POST /uploads/photos`, сохранять файл в локальное dev-хранилище или object storage, возвращать URL и записывать его в уже существующее поле `photoUrl`.

UI-компоненты в mobile можно почти не менять: выбор из галереи уже есть, нужно будет только заменить локальное сохранение data URL на реальный upload и запись полученного backend URL.

## Где смотреть

- `apps/api/prisma/schema.prisma`
- `apps/mobile/src/views/BullFormView.vue`
- `apps/mobile/src/views/BullListView.vue`
- `apps/mobile/src/views/BullDetailView.vue`
- `apps/mobile/src/utils/photo.ts`
- `packages/shared/src/index.ts`

См. также [[mobile сжимает фото из галереи перед сохранением в photoUrl]].
