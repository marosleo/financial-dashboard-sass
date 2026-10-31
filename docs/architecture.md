# Architecture Notes

## Monorepo

- `apps/web`: Next.js application for the user-facing dashboard.
- `apps/api`: NestJS application for APIs, integrations, and AI orchestration.
- `packages/shared`: shared types and utilities that are safe to reuse across apps.

## Backend boundaries

- `src/modules`: feature modules such as transactions, accounts, insights, auth.
- `src/common`: cross-cutting concerns such as interceptors, filters, guards, and shared helpers.
- `src/config`: environment parsing and application configuration.

## Frontend boundaries

- `app/`: routes, layouts, and page-level composition.
- `components/`: reusable UI pieces.
- `lib/`: fetch clients, formatters, and app-specific helpers.

## Authentication and data ownership

Supabase issues the browser session. The API validates every bearer token with Supabase before entering a protected route and stores the authenticated identity in an asynchronous request context. Services resolve the local user from that context, so accounts, transactions, connections, and insights always use the current user's identifier.

## Integration resilience

Pluggy synchronization uses unique provider identifiers to remain safe when an
item or webhook is processed more than once. Incoming webhooks are acknowledged
only after being persisted in PostgreSQL. A background worker claims jobs with
an atomic status update, recovers stale locks after a process crash, and retries
temporary failures with capped exponential backoff. After five attempts the
event remains as a failed record for investigation instead of being discarded.

This database-backed queue avoids another infrastructure dependency at the
project's current scale. A higher-throughput deployment could preserve the same
producer/consumer boundary and move jobs to SQS, BullMQ, or another managed
queue.

Gemini requests use bounded retries for temporary provider failures; when the
provider remains unavailable, the API creates a deterministic summary from the
same monthly transaction set.

## Observability

Every API response includes an `X-Request-Id`. The API emits one structured log
entry per request with the ID, method, path, status, and duration without
logging authorization headers or financial payloads. Queue lifecycle logs use
stable event names so a log platform can alert on retries and dead-lettered
events.

`GET /api/health` is a lightweight liveness probe. `GET /api/health/ready`
checks PostgreSQL and reports pending, processing, failed, and stale webhook
jobs. Keeping liveness and readiness separate prevents a temporary dependency
failure from needlessly restarting an otherwise healthy process.
