# Security policy

## Reporting a vulnerability

Do not open a public issue with credentials, real financial data, access tokens,
or reproducible account-takeover details. Use GitHub's private vulnerability
reporting for this repository when available.

Include the affected route or component, impact, reproduction steps using
synthetic data, and a suggested mitigation if known. Never test against another
person's account or institution.

## Security boundaries

- Nexo reads financial data but does not initiate payments.
- Supabase owns credential storage and session issuance.
- The API validates sessions and resource ownership.
- Pluggy credentials, webhook secrets, and Gemini keys are server-only values.
- Portfolio demo data is synthetic and write operations are blocked by the API.
- Logs must not contain bearer tokens, provider secrets, or transaction payloads.

## Deployment checklist

- Use HTTPS for web, API, callbacks, and webhooks.
- Store secrets in the hosting provider's secret manager.
- Configure the exact frontend origin in CORS.
- Use a random webhook secret with at least 32 characters.
- Keep PostgreSQL private and require encrypted connections in production.
- Keep Row Level Security enabled on every application table exposed through the
  Supabase `public` schema and grant no direct access to `anon` or `authenticated`.
- Run committed migrations before shifting traffic.
- Monitor `/api/health/ready` and dead-lettered webhook events.
- Rotate credentials immediately after suspected exposure.
