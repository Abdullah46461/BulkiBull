---
tags:
  - pattern
  - shared
date: 2026-04-15
project: Bulki Bull
---

# Shared пакет хранит общие типы и константы

`packages/shared` публикуется как `@bulki-bull/shared` и уже используется mobile-приложением для `APP_NAME`.

Сейчас в `packages/shared/src/index.ts` есть:

- `APP_NAME = 'Bulki Bull'`
- `ApiHealth`

## Правило развития

Когда появятся `Bull`, `WeightRecord` и API responses, общие DTO/типы лучше добавлять сюда. Это поможет держать API и mobile в одном контракте.

См. [[npm workspaces и turbo управляют монорепозиторием]].
