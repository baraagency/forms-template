# FUB Forms Starter

React Router v8 (Framework mode) template for Follow Up Boss embedded forms with MUI and Base UI. Use GitHub's **Use this template** button to start a new project from this repo.

## What's included

- Form router (`/forms`) with FUB embedded context verification
- Form settings (`/forms/settings`) — Gmail, recipients, per-form visibility and mappings
- Pending form example (`/forms/pending`) — multi-step intake UI
- Appointment Set form example (`/forms/appointment-set`)
- Appointment Met form example (`/forms/appointment-met`)
- Closed form example (`/forms/closed`)
- Shared form core in `app/forms/_core/`
- Mock API resource routes for FUB and SISU (no credentials required locally)
- Post-submit confirmation page (`/forms/submitted`)

## Quick start

```bash
cp .env.example .env
bun install
bun run dev
```

Open [http://localhost:5173/forms](http://localhost:5173/forms).

With `DEMO_MODE=true` (see `.env.example`), opening `/forms` or `/forms/pending` **without** a `clientId` uses fixture agent/client/deal IDs so you can click through the full mock flow.

## Template fixture IDs

| Resource | ID |
|----------|-----|
| FUB person | `123` |
| FUB agent | `1` |
| FUB deal | `456` |
| SISU transaction | `789` |

Example pending URL:

```
/forms/pending?clientId=123&agentId=1&dealId=456&sisuTransactionId=789&clientName=Jane+Client
```

## FUB embedded context

`/api/fub/context` performs real HMAC verification using `FUB_SECRET_KEY`. Generate a signed test URL:

```bash
bun run dev:fub-context
```

All other API routes return fixtures from `app/api/_fixtures/`.

## Adding a new form

1. Copy `app/forms/pending/` → `app/forms/<your-slug>/`
2. Add `app/routes/forms.<your-slug>.tsx` and register it in `app/routes.ts`
3. Register the form in `app/forms/_core/formRouterFormRegistry.ts` and seed `router_forms`
4. Add field keys to `app/forms/settings/formFieldCatalog.ts` (+ migration seed) when mappings are needed
5. Add `app/api/forms/<your-slug>/submit/route.ts` (`action` → `runSubmissionWorkflow`) and register the path in `app/routes.ts`
6. Import shared UI from `app/forms/_core/` only

See [docs/adding-a-form.md](docs/adding-a-form.md).

## Customize branding

- Replace `public/form-banner.svg` with your logo (PNG/SVG also work — update `FORM_BANNER_SRC` in `app/forms/_core/FormBanner.tsx`).
- Adjust colors in `app/globals.css` (`:root` `--palette-1` / `--palette-2` / `--palette-3`) and mirror them in `app/AppTheme.tsx`.
- Layout chrome (`.page-form`, `.page-header`, launch buttons) lives in `app/globals.css`.

## Database

Postgres schema lives in `db/migrations/`. Set `DATABASE_URL` in `.env`, then:

```bash
bun run db:migrations
```

Creates submissions, SISU mappings, audit log, Gmail credentials, email recipients, `router_forms`, and FUB mapping tables.

Optional local test DB (not committed):

```bash
docker run --rm -d --name forms-pg \
  -e POSTGRES_PASSWORD=forms -e POSTGRES_USER=forms -e POSTGRES_DB=fub_forms \
  -p 5432:5432 postgres:16-alpine
```

Gmail OAuth on `/forms/settings` needs `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and optionally `GOOGLE_REDIRECT_URI` / `APP_BASE_URL` (defaults assume `http://localhost:5173`).

## Deploy (Heroku)

- Node `22.22+` (`engines` in `package.json`)
- `Procfile`: `web: npm run start`
- Build: `npm run build` (React Router / Vite)
- Start: `react-router-serve ./build/server/index.js` (binds `PORT`)
- Set `APP_BASE_URL` and `GOOGLE_REDIRECT_URI` to the Heroku HTTPS origin

## Scripts

| Command | Purpose |
|---------|---------|
| `bun run dev` | Start Vite / React Router dev server |
| `bun run build` | Production build |
| `bun run start` | Serve production build |
| `bun test app` | Unit tests |
| `bun run test:e2e` | Playwright smoke tests |
| `bun run dev:fub-context` | Print signed `/forms?context=...&signature=...` |
| `bun run db:migrations` | Apply pending Postgres migrations |
