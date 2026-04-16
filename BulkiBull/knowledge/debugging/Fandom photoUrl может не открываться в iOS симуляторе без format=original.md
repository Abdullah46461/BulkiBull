---
tags:
  - debugging
  - mobile
  - photo
  - ios
date: 2026-04-16
project: Bulki Bull
---

# Fandom photoUrl может не открываться в iOS симуляторе без format=original

Если `photoUrl` указывает на `static.wikia.nocookie.net/.../revision/latest?...`, desktop browser может показать картинку нормально, а iOS-симулятор или Capacitor WebView может отрисовать битый placeholder.

## Почему это происходит

Fandom/Wikia по content negotiation часто отдает такой URL как `image/webp`. В desktop web это обычно не проблема, но в iOS WebView такой ответ оказался нестабильным для нашего сценария.

## Как чинить

Перед отображением фото:

- распарсить URL;
- если hostname равен `static.wikia.nocookie.net`;
- и путь содержит `/revision/`;
- и в query еще нет `format`;
- добавить `format=original`.

После этого источник начинает отдавать исходный формат картинки и превью снова видно в симуляторе.

## Где смотреть

- `apps/mobile/src/utils/photo.ts`
- `apps/mobile/src/views/BullListView.vue`
- `apps/mobile/src/views/BullDetailView.vue`
- `apps/mobile/src/views/BullFormView.vue`
