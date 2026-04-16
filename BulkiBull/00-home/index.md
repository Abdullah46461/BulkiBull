---
tags:
  - home
  - codex
  - vault
aliases:
  - Bulki Bull Knowledge Vault
date: 2026-04-15
project: Bulki Bull
---

# Bulki Bull Knowledge Vault

Это Obsidian-хранилище долгосрочной памяти проекта Bulki Bull для Codex. Оно адаптирует схему из брошюры про Claude Code: вместо `CLAUDE.md` используется корневой `AGENTS.md`, а заметки в этом vault дают Codex контекст между сессиями.

## Как читать vault

При старте работы Codex должен сначала открыть эту карту и [[текущие приоритеты]], затем перейти к заметкам по задаче.

Если задача про архитектуру, стек или инфраструктуру:

- [[архитектура монорепозитория Bulki Bull]]
- [[стек проекта Bulki Bull]]
- [[локальная инфраструктура PostgreSQL через Docker Compose]]

Если задача про продукт:

- [[Bulki Bull это мобильный учет бычков на откорме]]

Если задача про текущие технические решения и паттерны:

- [[текущий вес вычисляется из последней записи взвешивания]]
- [[фото в MVP хранится как photoUrl]]
- [[mobile сжимает фото из галереи перед сохранением в photoUrl]]
- [[Codex использует AGENTS.md вместо CLAUDE.md для подключения vault]]
- [[npm workspaces и turbo управляют монорепозиторием]]
- [[shared пакет хранит общие типы и константы]]
- [[health endpoint проверяет подключение Prisma к PostgreSQL]]
- [[NestJS API подключается к PostgreSQL через Prisma]]
- [[проверка health endpoint быстро ловит проблемы PostgreSQL]]
- [[localhost 5173 открывается только при запущенном mobile dev server]]
- [[Fandom photoUrl может не открываться в iOS симуляторе без format=original]]

## Текущий статус проекта

Этапы 1-5 завершены: собран рабочий MVP-скелет с NestJS API, Prisma/PostgreSQL, Ionic Vue mobile app, shared DTO/types/Zod-схемами, CRUD-сценариями для бычков, историей взвешиваний и фото через `photoUrl`.

Поверх этого MVP mobile уже умеет выбирать фото из галереи и временно сохранять сжатое изображение в `photoUrl`, пока нет отдельного backend upload.

Следующая итерация должна начинаться не с нового foundation, а с осознанного расширения MVP: тесты, настоящая загрузка фото, улучшение UX ошибок, pagination/lazy loading и production/deploy notes.

## Workflow

В конце важной работы пользователь может сказать: `сохрани сессию`. Тогда Codex должен создать заметку в `sessions/`, обновить [[текущие приоритеты]] и добавить новые решения, баги или паттерны в `knowledge/`.
