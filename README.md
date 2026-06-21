# Financial Dashboard

Monorepo base for an AI-powered financial dashboard using Next.js, NestJS, Prisma, PostgreSQL, and shared TypeScript packages.

## Stack

- `apps/web`: Next.js App Router + Tailwind CSS
- `apps/api`: NestJS + Prisma
- `packages/shared`: shared TypeScript contracts
- `prisma/`: database schema and Prisma client generation

## Project structure

```text
apps/
  api/
    src/
      common/
      config/
      modules/
  web/
    app/
    components/
    lib/
packages/
  shared/
prisma/
```

## Environment

Create a local `.env` based on [.env.example](./.env.example).

Required variables:

- `DATABASE_URL`
- `NEXT_PUBLIC_API_URL`
- `FRONTEND_URL`
- `PORT`

Optional placeholders already reserved:

- `ANTHROPIC_API_KEY`
- `PLUGGY_CLIENT_ID`
- `PLUGGY_CLIENT_SECRET`

## Commands

```bash
npm install
npm run dev
```

`npm run dev` now:
- starts PostgreSQL with Docker
- generates the Prisma client
- starts the API on `3001`
- starts the web app on `3002`

PostgreSQL is exposed on `5433` to avoid conflicts with a local database already using `5432`.

Useful checks:

```bash
npm run lint
npm run typecheck
npm run build
```

## API base routes

- `GET /api/health`
- `GET /api/auth/status`
- `GET /api/accounts`
- `GET /api/transactions`
- `GET /api/insights/status`

These routes are scaffolding only. They exist to give the backend a stable module layout before the real implementation.

## Learning boundary

- Boilerplate, configs, module layout, DTO shells and infrastructure can be generated.
- Business logic, financial rules, Pluggy integration flow, Claude orchestration and final UI should be implemented manually.
