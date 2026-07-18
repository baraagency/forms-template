# FUB Forms Starter

Next.js template for Follow Up Boss embedded forms with MUI and `@baraagency/components`. Use GitHub's **Use this template** button to start a new project from this repo.

## What's included

- Form router (`/forms`) with FUB embedded context verification
- Form settings (`/forms/settings`) — Gmail, recipients, per-form visibility and mappings
- Pending form example (`/forms/pending`) — multi-step intake UI
- Appointment Set form example (`/forms/appointment-set`)
- Appointment Met form example (`/forms/appointment-met`)
- Closed form example (`/forms/closed`)
- Shared form core in `app/forms/_core/`
- Mock API routes for FUB and SISU (no credentials required locally)
- Post-submit confirmation page (`/forms/submitted`)

## Quick start

```bash
cp .env.example .env
bun install
bun run dev
```

Open [http://localhost:3000/forms](http://localhost:3000/forms).

With `ENVIRONMENT=LOCAL` (see `.env.example`), opening `/forms` or `/forms/pending` **without** a `clientId` uses fixture agent/client/deal IDs so you can click through the full mock flow.

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
2. Register the form in `app/forms/_core/formRouterFormRegistry.ts` and seed `router_forms`
3. Add field keys to `app/forms/settings/formFieldCatalog.ts` (+ migration seed) when mappings are needed
4. Add `POST /api/forms/<your-slug>/submit` returning a mock success payload
5. Import shared UI from `app/forms/_core/` only

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

Creates submissions, SISU mappings, audit log, Gmail credentials, email recipients, `router_forms`, and FUB mapping tables. Form settings CRUD uses these tables; submit routes are still mocked and do not write submissions or apply mappings yet.

Optional local test DB (not committed):

```bash
docker run --rm -d --name forms-pg \
  -e POSTGRES_PASSWORD=forms -e POSTGRES_USER=forms -e POSTGRES_DB=fub_forms \
  -p 5432:5432 postgres:16-alpine
```

Gmail OAuth on `/forms/settings` needs `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and optionally `GOOGLE_REDIRECT_URI` / `APP_BASE_URL`.

## Scripts

| Command | Purpose |
|---------|---------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun test app` | Unit tests |
| `bun run test:e2e` | Playwright smoke tests |
| `bun run dev:fub-context` | Print signed `/forms?context=...&signature=...` |
| `bun run db:migrations` | Apply pending Postgres migrations |
