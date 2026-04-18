---
tags:
  - debugging
  - mobile
  - ios
  - capacitor
date: 2026-04-17
project: Bulki Bull
---

# Capacitor copy и sync не обновляют уже установленный iOS build в симуляторе

После `npm run build`, `npx cap copy ios` или `npx cap sync ios` изменения могут уже лежать в `apps/mobile/ios/App/App/public/`, но открытое приложение в iOS Simulator все еще показывает старый UI.

## Симптом

- изменение видно в web-версии;
- новая строка или кнопка уже находится в `ios/App/App/public/assets/index-*.js`;
- в симуляторе открыт прежний экран без свежих правок.

## Что это значит

`cap copy` и `cap sync` обновляют файлы внутри iOS-проекта, но не переустанавливают уже собранный `App.app` в симулятор. Если нативный билд не пересобран и не установлен заново, пользователь может видеть старую версию приложения.

## Что делать

Для надежного обновления iOS Simulator нужен полный нативный цикл:

```bash
cd apps/mobile
npm run build
npx cap sync ios
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination 'id=<simulator-id>' -derivedDataPath ios/build build
xcrun simctl install <simulator-id> ios/build/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch <simulator-id> com.bulkibull.app
```

Если нужно быстро понять, stale ли это native build, полезно сначала проверить, попал ли новый текст в `apps/mobile/ios/App/App/public/assets/index-*.js`.

## Где смотреть

- `apps/mobile/ios/App/App/public/`
- `apps/mobile/ios/build/Build/Products/Debug-iphonesimulator/App.app`
- `apps/mobile/capacitor.config.ts`

См. также [[mobile lint может захватить ios DerivedData после cap run ios]].
