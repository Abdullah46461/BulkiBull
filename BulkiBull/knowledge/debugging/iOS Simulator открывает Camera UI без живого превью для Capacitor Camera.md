---
tags:
  - debugging
  - mobile
  - ios
  - simulator
  - photo
date: 2026-04-17
project: Bulki Bull
---

# iOS Simulator открывает Camera UI без живого превью для Capacitor Camera

Если в desktop web кнопка камеры работает, а в iOS Simulator открывается native camera screen с серым или пустым preview, это не обязательно значит, что сломан `Camera.takePhoto`.

## Почему это происходит

В browser-режиме desktop web использует [[desktop web использует PWA Elements для Camera.takePhoto]] и берет видео через web APIs браузера. В нативном iOS-приложении вызывается `@capacitor/camera`, а iOS Simulator не дает надежной замены реальной камеры устройства для такого сценария.

Из-за этого можно увидеть открывшийся camera UI без рабочего live preview, хотя тот же код на реальном телефоне должен вести себя иначе.

## Как с этим работать

- camera flow проверять на реальном iPhone;
- в симуляторе для smoke-проверок использовать `Выбрать из галереи`;
- не считать серый preview в симуляторе достаточным доказательством, что плагин или permissions сломаны.

## Где смотреть

- `apps/mobile/src/views/BullFormView.vue`
- `apps/mobile/src/main.ts`
- `apps/mobile/ios/App/App/Info.plist`

См. также [[desktop web использует PWA Elements для Camera.takePhoto]].
