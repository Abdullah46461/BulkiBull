---
tags:
  - session
  - mobile
  - ios
  - ux
  - theme
date: 2026-04-26
project: Bulki Bull
---

# Тема и глобальный footer mobile

## Контекст

Пользователь попросил добавить светлую и темную тему для mobile-приложения, а затем несколько раз донастроил UX нижней навигации под узкий экран. В процессе стало ясно, что отдельный экран оформления перегружает сценарий, а локально встроенный footer в списке и кормах плохо ведет себя на других экранах и в iOS Simulator.

## Что изменено

- В `apps/mobile` добавлен централизованный слой темы с поддержкой `light`, `dark` и `system`, сохранением выбора и применением Ionic dark palette.
- Отдельная страница оформления убрана: тема теперь переключается inline-кнопкой в header.
- Основная навигация mobile вынесена в глобальный footer через `App.vue` и route `meta`, чтобы один и тот же tab bar работал на списке, кормах, формах и карточке.
- Footer несколько раз дорабатывался по референсам и в итоге переведен в текстовые табы без иконок.
- Для каждого важного изменения выполнялся полный iOS rebuild/install/launch, чтобы проверить результат не только в web, но и в нативной оболочке симулятора.

## Важные решения

- [[mobile тема переключается inline toggle без отдельного экрана]]

## Паттерны

- [[mobile использует глобальный footer tab bar через App shell]]

## Известные сценарии и отладка

- [[локальный footer внутри экрана mobile исчезает на формах и просвечивает при скролле]]
- [[Capacitor copy и sync не обновляют уже установленный iOS build в симуляторе]]

## Проверки

В этой сессии проходили:

```bash
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run build -w apps/mobile
npm run typecheck -w apps/mobile
npm run lint -w apps/mobile
cd apps/mobile
npx cap sync ios
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -destination 'id=ACD906DF-93BE-49AB-A079-53043EDC4F5A' -derivedDataPath ios/build build
xcrun simctl install ACD906DF-93BE-49AB-A079-53043EDC4F5A ios/build/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch ACD906DF-93BE-49AB-A079-53043EDC4F5A com.bulkibull.app
```

## Что дальше

- При следующей UX-итерации решить, должен ли footer оставаться текстовым или нужно вернуть компактные иконки с подписями.
- При желании вынести полный iOS rebuild/install/launch в отдельный script вроде `ios:rebuild`.
- Позже покрыть theming и mobile shell smoke-тестом, чтобы такие правки было проще стабильно проверять.
