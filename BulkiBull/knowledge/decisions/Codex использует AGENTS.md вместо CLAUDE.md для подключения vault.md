---
tags:
  - decision
  - codex
  - obsidian
date: 2026-04-15
project: Bulki Bull
---

# Codex использует AGENTS.md вместо CLAUDE.md для подключения vault

## Контекст

Брошюра по Obsidian + Claude Code предлагает хранить инструкцию подключения vault в `CLAUDE.md`. Для Codex в этом проекте роль такой инструкции выполняет корневой `AGENTS.md`.

## Решение

Создать `AGENTS.md` в корне репозитория и записать туда:

- путь к Obsidian vault: `/Users/abdullabeterbiev/Desktop/bulki bull/BulkiBull`;
- что читать при старте работы;
- что делать при команде `сохрани сессию`;
- правила именования и обновления заметок.

## Почему

Так Codex получает тот же слой долгосрочной памяти, который в брошюре был построен для Claude Code, но без привязки к `CLAUDE.md`.

См. [[index|Bulki Bull Knowledge Vault]] и [[текущие приоритеты]].
