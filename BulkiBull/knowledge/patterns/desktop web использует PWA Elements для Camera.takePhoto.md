---
tags:
  - pattern
  - mobile
  - web
  - camera
  - capacitor
date: 2026-04-17
project: Bulki Bull
---

# Desktop web использует PWA Elements для Camera.takePhoto

Если mobile-приложение на Capacitor должно уметь снимать фото и в browser-режиме, одного `@capacitor/camera` недостаточно: на web без дополнительного UI `takePhoto` может откатиться к обычному file picker.

## Паттерн

1. Подключить `@ionic/pwa-elements` в mobile workspace.
2. В bootstrap приложения проверять `Capacitor.getPlatform()`.
3. Только для `web` вызывать `defineCustomElements(window)`.
4. В photo flow вызывать `Camera.takePhoto({ webUseInput: false, ... })`.
5. Дальше не ветвить остальную логику: обрабатывать полученный `webPath` тем же кодом, что и после native camera или gallery.

## Зачем это нужно

- desktop web получает нормальный camera modal вместо системного file picker;
- browser и native используют один и тот же `Camera.takePhoto` API;
- downstream-код сжатия и сохранения в `photoUrl` остается общим.

## Где смотреть

- `apps/mobile/package.json`
- `apps/mobile/src/main.ts`
- `apps/mobile/src/views/BullFormView.vue`

См. также [[фото в MVP хранится как photoUrl]].
