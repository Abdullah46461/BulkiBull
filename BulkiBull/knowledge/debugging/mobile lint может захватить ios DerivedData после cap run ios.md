---
tags:
  - debugging
  - mobile
  - lint
  - ios
date: 2026-04-17
project: Bulki Bull
---

# Mobile lint может захватить ios DerivedData после cap run ios

После `npx cap run ios` Xcode создает `apps/mobile/ios/DerivedData/`, и `npm run lint -w apps/mobile` может начать обходить этот каталог вместе со сгенерированными framework и bundled JS-файлами.

## Симптом

Команда lint внезапно падает не на исходниках проекта, а на тысячах ошибок внутри:

- `apps/mobile/ios/DerivedData/...`
- `App.app/public/assets/...`
- `Capacitor.framework/native-bridge.js`

## Что это значит

Это не обязательно регресс в нашем Vue/Ionic-коде. Чаще всего ESLint просто зашел в generated output после нативного запуска приложения.

## Что делать сейчас

В проекте уже добавлены явные ignore для generated iOS output:

- `eslint.config.mjs` игнорирует `apps/mobile/ios/DerivedData/**` и `apps/mobile/ios/App/App/public/**`;
- `.prettierignore` игнорирует `apps/mobile/ios/DerivedData`, `apps/mobile/ios/App/App/public`, `apps/mobile/ios/App/App/capacitor.config.json` и `apps/mobile/ios/App/App/Assets.xcassets`.

Если после очередного нативного запуска появляются новые generated-пути, лучше расширить ignore-список, чем разбирать ESLint-ошибки внутри bundled JS и framework artifacts.

## Где смотреть

- `apps/mobile/ios/DerivedData/`
- `eslint.config.mjs`
- `.prettierignore`
