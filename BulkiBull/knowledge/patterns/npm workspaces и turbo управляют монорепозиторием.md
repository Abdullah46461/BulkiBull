---
tags:
  - pattern
  - monorepo
date: 2026-04-15
project: Bulki Bull
---

# npm workspaces и turbo управляют монорепозиторием

Корневой `package.json` объявляет workspaces:

- `apps/*`
- `packages/*`

Turbo управляет общими задачами `build`, `dev`, `lint`, `typecheck`. `build`, `lint` и `typecheck` зависят от сборки upstream packages, поэтому shared package должен собираться до приложений, которые его используют.

## Практическое правило

Если изменение касается API и mobile одновременно, сначала проверь `packages/shared`. Общие контракты не стоит дублировать в приложениях.

Связано с [[shared пакет хранит общие типы и константы]] и [[архитектура монорепозитория Bulki Bull]].
