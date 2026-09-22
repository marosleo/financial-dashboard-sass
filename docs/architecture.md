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

Pluggy synchronization uses unique provider identifiers to remain safe when an item or webhook is processed more than once. Gemini requests use bounded retries for temporary provider failures; when the provider remains unavailable, the API creates a deterministic summary from the same monthly transaction set.
