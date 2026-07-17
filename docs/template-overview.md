# Template Overview

## Architecture

```mermaid
flowchart LR
  Router["/forms"] --> Context["/api/fub/context REAL"]
  Router --> MockFub["/api/fub/* fixtures"]
  Pending["/forms/pending"] --> MockSisu["/api/sisu/* fixtures"]
  Pending --> Submit["POST /api/forms/pending/submit mock"]
  Submit --> Submitted["/forms/submitted"]
```

## What's real vs mocked

| Component | Behavior |
|-----------|----------|
| `/api/fub/context` | Real HMAC verification with `FUB_SECRET_KEY` |
| Other FUB routes | Fixture JSON |
| SISU routes | Fixture JSON |
| Pending submit | Validates form, returns fixture success |
| Postgres | Schema via `db/migrations`; not wired to submit routes yet |
| Gmail / Redis | Removed |

## Core directories

- `app/forms/_core/` — reusable form UI, routing, validation, submission helpers
- `app/forms/pending/` — example form to copy
- `app/api/_fixtures/` — mock API response data
- `db/migrations/` — Postgres schema (form_submissions, form_sisu_mappings, app_audit_log)

## Database

Set `DATABASE_URL`, then apply migrations:

```bash
npm run db:migrations
```

Tables: unified `form_submissions` and `form_sisu_mappings` (discriminated by `form`), plus `app_audit_log`.
