# Financial Dashboard

AI-powered financial dashboard MVP using Next.js, NestJS, Prisma, PostgreSQL, and shared TypeScript contracts.

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

Optional AI configuration:

- `ANTHROPIC_API_KEY`

Pluggy Open Finance configuration:

- `PLUGGY_CLIENT_ID`
- `PLUGGY_CLIENT_SECRET`
- `PLUGGY_WEBHOOK_URL`
- `PLUGGY_WEBHOOK_SECRET`

## Commands

```bash
npm install
npm run setup
npm run dev
```

`npm run setup`:

- starts PostgreSQL with Docker
- applies Prisma migrations
- seeds demo financial data
- builds the shared package

`npm run dev`:

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
- `GET /api/dashboard`
- `GET /api/insights`
- `GET /api/insights/status`
- `GET /api/pluggy/status`
- `POST /api/pluggy/connect-token`
- `POST /api/pluggy/items/:itemId/sync`
- `POST /api/pluggy/connections/:connectionId/sync`
- `POST /api/pluggy/connections/:connectionId/connect-token`
- `DELETE /api/pluggy/connections/:connectionId`
- `POST /api/pluggy/webhooks`

## Pluggy setup

1. Create an application in the Pluggy Dashboard.
2. Add its `clientId` and `clientSecret` to the local `.env`.
3. Start the project and use **Connect bank** on the dashboard.
4. Use a Pluggy sandbox connector before connecting a real institution.

The widget callback synchronizes accounts and transactions immediately, so local development works without a public webhook. For deployed environments, configure:

```env
PLUGGY_WEBHOOK_URL="https://api.example.com/api/pluggy/webhooks"
PLUGGY_WEBHOOK_SECRET="replace-with-at-least-32-random-characters"
```

On the first Connect Token request, the backend registers an `all` webhook with the secret header. Webhook event IDs are persisted to prevent duplicate processing. Pluggy account and transaction IDs are also unique in PostgreSQL, making repeated synchronization safe.

When real Pluggy accounts exist, dashboard queries stop mixing them with demo seed data. Removing a connection deletes its locally imported accounts and transactions. The seed becomes the fallback again.

The current login is still a demo session. Do not deploy it with real financial data until production authentication and route guards are implemented.

## MVP scope

- Dashboard overview with balance, income, expenses, and net result.
- Account list backed by PostgreSQL.
- Transaction list with pagination validation.
- Spending by category and six-month trend aggregation.
- Pluggy Connect widget with sandbox support.
- Idempotent account and transaction synchronization.
- Webhook ingestion with idempotency and failure tracking.
- Reconnection, manual sync, and disconnection flows.
- Seeded insights shaped like future AI output.
- Frontend dashboard consuming the NestJS API at runtime.
