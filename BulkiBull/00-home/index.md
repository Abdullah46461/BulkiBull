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

- [[stage 1 оставляет бизнес-модели Prisma на следующий этап]]
- [[Codex использует AGENTS.md вместо CLAUDE.md для подключения vault]]
- [[npm workspaces и turbo управляют монорепозиторием]]
- [[shared пакет хранит общие типы и константы]]
- [[health endpoint проверяет подключение Prisma к PostgreSQL]]
- [[NestJS API подключается к PostgreSQL через Prisma]]
- [[проверка health endpoint быстро ловит проблемы PostgreSQL]]

## Текущий статус проекта

Stage 1 готов: монорепозиторий, NestJS API, Ionic Vue mobile, shared package, Prisma, PostgreSQL через Docker Compose, базовые quality checks. Бизнес-модели и пользовательские сценарии еще не реализованы.

## Workflow

В конце важной работы пользователь может сказать: `сохрани сессию`. Тогда Codex должен создать заметку в `sessions/`, обновить [[текущие приоритеты]] и добавить новые решения, баги или паттерны в `knowledge/`.
