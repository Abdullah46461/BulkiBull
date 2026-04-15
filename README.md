# Bulki Bull

MVP mobile application for tracking bulls on feed.

## Stage 1 Status

Foundation is ready:

- npm workspaces monorepo.
- Turbo orchestration.
- NestJS API skeleton.
- Ionic Vue mobile skeleton.
- Shared TypeScript package.
- PostgreSQL via Docker Compose.
- Prisma connected in the API.
- ESLint, Prettier and TypeScript configured.

Business entities, CRUD and mobile MVP flows are intentionally not implemented yet.

## Stack

- Monorepo: npm workspaces
- Orchestration: Turbo
- Backend: Node.js, NestJS, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- API style: REST
- Mobile: Ionic Vue, Vue 3, TypeScript, Vite
- Shared code: TypeScript package
- Local infrastructure: Docker Compose

## Repository Structure

```text
apps/
  api/       NestJS backend API
  mobile/    Ionic Vue mobile app
packages/
  shared/    shared types, constants and future DTO/schemas
infra/
  docker/    local Docker notes
  db/        database notes
```

## Requirements

- Node.js 20.11+ or 22.x
- npm 10+
- Docker Desktop or compatible Docker daemon

Current local verification used Node.js `22.11.0` and npm `10.9.0`.

## Environment

Example env files:

- `.env.example`
- `apps/api/.env.example`
- `apps/mobile/.env.example`

For local development, copy example files if you need custom values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

The API also has a dev fallback for `DATABASE_URL`, so Stage 1 scripts work with the default Docker Compose database.

## Install

```bash
npm install
npm run prisma:generate -w apps/api
```

## Run Local Database

```bash
npm run db:up
```

PostgreSQL runs on `localhost:5432` with:

- database: `bulki_bull`
- user: `bulki`
- password: `bulki`

Stop local infrastructure:

```bash
npm run db:down
```

## Run API

```bash
npm run dev -w apps/api
```

Health check:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "api",
  "database": "ok"
}
```

## Run Mobile

```bash
npm run dev -w apps/mobile
```

Open:

```text
http://localhost:5173
```

## Quality Checks

```bash
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run prisma:validate -w apps/api
```

## Stage 1 TODO

- TODO: Add Prisma models for `Bull` and `WeightRecord` in Stage 2.
- TODO: Add migrations and seed data in Stage 2.
- TODO: Add REST endpoints in Stage 2.
- TODO: Replace mobile placeholder screen with MVP screens in Stage 3.
- TODO: Add photo handling in Stage 4.
