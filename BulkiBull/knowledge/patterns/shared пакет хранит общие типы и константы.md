---
tags:
  - pattern
  - shared
date: 2026-04-15
project: Bulki Bull
---

# Shared пакет хранит общие типы и константы

`packages/shared` публикуется как `@bulki-bull/shared` и используется backend и mobile как единый источник контрактов.

Сейчас в `packages/shared/src/index.ts` есть:

- response-типы API;
- Zod-схемы для создания и редактирования бычка;
- Zod-схема для добавления веса;
- enum-like values для пола бычка;
- утилиты расчета и форматирования возраста.

## Правило развития

Новые DTO и response-типы сначала добавлять в shared, затем подключать в `apps/api` и `apps/mobile`. Это помогает держать API и mobile в одном контракте.

Если контракт содержит runtime validation, использовать Zod-схему из shared, а не дублировать проверку вручную.

См. [[npm workspaces и turbo управляют монорепозиторием]] и [[текущий вес вычисляется из последней записи взвешивания]].
