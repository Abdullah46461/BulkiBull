---
tags:
  - session
  - codex
  - obsidian
date: 2026-04-15
project: Bulki Bull
---

# 2026-04-15 настройка Obsidian vault для Codex

## Что сделано

- Изучена брошюра про Obsidian + Claude Code.
- Подход адаптирован под Codex через корневой `AGENTS.md`.
- Создана структура Obsidian vault в `BulkiBull/`.
- Добавлены стартовые заметки по архитектуре, стеку, инфраструктуре, решениям, паттернам, debugging и продукту.

## Главная адаптация

Вместо `CLAUDE.md` используется [[Codex использует AGENTS.md вместо CLAUDE.md для подключения vault]]. Codex должен читать `AGENTS.md`, затем [[index|Bulki Bull Knowledge Vault]] и [[текущие приоритеты]].

## Следующий шаг

При развитии Stage 2 добавить заметки про `Bull`, `WeightRecord`, миграции, seed-данные и REST endpoints.
