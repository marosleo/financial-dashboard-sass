# AGENTS.md

## Project Context

Nexo is both a portfolio project and a practical full-stack learning exercise. The
repository should demonstrate production-minded engineering while keeping every
technical decision understandable and defensible in an interview.

---

## Critical: AI-Assisted Delivery Rules

This project is still a learning project, but the working model is now delivery-first. The assistant may implement complete features end-to-end when asked, including business logic, UI components, integrations, data aggregation, and API calls.

Learning happens through review after implementation: every meaningful technical decision must be explainable in a job interview, and the assistant must help the developer understand the codebase after shipping.

### DO

- Implement complete features when requested, including backend, frontend, database, tests, and documentation.
- Make pragmatic product decisions when details are missing, then explain the assumptions and trade-offs.
- Keep commits small, meaningful, and in English.
- Push frequently to GitHub after validated increments.
- Run relevant checks before committing whenever feasible.
- Explain the important architecture, domain, security, and performance decisions after each substantial change.
- Highlight interview-relevant sections that the developer should study later.
- Challenge weak product or technical assumptions when they would hurt the portfolio or production quality.

### DO NOT

- Do not hide complexity or pretend generated code is self-explanatory.
- Do not commit secrets, tokens, real bank data, or private credentials.
- Do not integrate paid/external services in a way that can create unexpected costs without calling it out clearly.
- Do not skip validation, error handling, or security basics just to move faster.
- Do not make large, hard-to-review changes without summarizing the implementation boundaries.

### Practical Rule

> The assistant may write the code. The developer must be able to explain, modify, and defend the shipped solution afterward.

---

## Tech Stack

| Layer        | Technology                            |
| ------------ | ------------------------------------- |
| Frontend     | Next.js (App Router) + TypeScript     |
| Backend      | Node.js with NestJS + TypeScript      |
| Database     | PostgreSQL + Prisma ORM               |
| Styling      | Tailwind CSS                          |
| Charts       | Recharts (or similar)                 |
| AI           | Gemini API for summaries and insights |
| Open Finance | Pluggy API (JS/TS SDK)                |
| Infra        | Docker for local dev                  |

---

## Project: AI-Powered Financial Dashboard via Open Finance

### Overview

A fullstack web app that connects to the user's bank account (initially Nubank) via Open Finance using the Pluggy API, pulls real transactions, and provides:

1. **Spending dashboard** — visualization by category, period, monthly trends.
2. **Smart categorization** — transactions are automatically categorized (Pluggy returns basic categories, the app refines with AI).
3. **AI summaries and insights** — using the Gemini API to generate monthly natural-language analyses: spending patterns, increase alerts, savings suggestions.
4. **History and trends** — month-over-month comparison, simple projections.

### Main Flow

```
User logs in → Connects account via Pluggy Connect (OAuth widget)
→ App receives token → Backend fetches transactions via Pluggy API
→ Transactions saved to PostgreSQL → Frontend displays dashboards
→ User requests AI summary → Backend sends transactions to Gemini API
→ Gemini returns analysis → Frontend displays the insight
```

### Portfolio Differentiators

- Real Open Finance integration — not mocked data.
- End-to-end JS/TS fullstack — Next.js + NestJS + Prisma + PostgreSQL.
- Purposeful AI application — not a generic chatbot, but contextual financial analysis.
- A product the developer actually uses — authenticity when discussing the project.

---

## Expected Repository Structure

```
/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types and utils
├── prisma/
│   └── schema.prisma
├── docker-compose.yml
├── AGENTS.md         # This file
└── README.md
```

---

## Commands

- `npm run dev` — Start development (both frontend and backend)
- `npm run lint` — Lint all packages
- `npm run test` — Run tests
- `npx prisma migrate dev` — Run database migrations
- `docker-compose up -d` — Start PostgreSQL locally

---

## Additional Notes

- Code and commits must be in English.
- This is a learning project with a flexible deadline. Quality and understanding > speed.
