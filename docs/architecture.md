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

## Learning rule

This repository intentionally separates boilerplate from interview-relevant implementation. The structure is generated; the domain logic should be written manually.
