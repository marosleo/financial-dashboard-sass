# Production deployment

Nexo ships as two independent containers: a Next.js web application and a
NestJS API. PostgreSQL, Supabase, Pluggy and Gemini remain external services.
This boundary keeps credentials out of the images and lets each application
scale independently.

## Required configuration

The web image receives these public values at **build time**:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Next.js embeds `NEXT_PUBLIC_*` values in the browser bundle. Rebuild the web
image when any of them changes. The API receives its configuration at runtime;
use the hosting provider's secret manager for `DATABASE_URL`, Gemini and Pluggy
credentials.

Production URLs must use HTTPS. Configure:

- `FRONTEND_URL` with the exact public web origin used by CORS;
- the Supabase authentication Site URL and redirect allowlist;
- `PLUGGY_WEBHOOK_URL` as `https://<api-host>/api/pluggy/webhooks`;
- a random `PLUGGY_WEBHOOK_SECRET` with at least 32 characters;
- `DEMO_MODE_ENABLED=true` only when the public portfolio demo is desired.

## Local production rehearsal

Create an ignored `.env.production` with the values documented in
`.env.example`, plus a strong `POSTGRES_PASSWORD`. Then run:

```bash
docker compose --env-file .env.production -f compose.production.yml up --build
```

The API entrypoint applies committed Prisma migrations before starting. When
demo mode is enabled, it also runs the idempotent portfolio seed. API readiness
is checked at `/api/health/ready`; the web container checks `/login`. The
lightweight API liveness endpoint remains available at `/api/health`.

## Managed container platform

Create one service from `Dockerfile.api` and another from `Dockerfile.web`.
Attach a managed PostgreSQL database to the API. The API needs persistent
network access but no filesystem volume. Build the web image with the three
public arguments above, then expose its container port `3002`; expose API port
`3001`.

Use the platform health checks below:

```text
web: GET /login
api liveness: GET /api/health
api readiness: GET /api/health/ready
```

After the first deployment, validate the public demo, authenticated login,
Open Finance callback and webhook delivery. Never use a real bank account for
automated smoke tests.

## Rollback

Images are immutable, so application rollback means redeploying the previous
image tag. Database migrations must remain backward-compatible with the prior
application version. Destructive schema changes should use an expand/migrate/
contract sequence instead of removing a column in the same release.
