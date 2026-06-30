# FUB Forms Starter

Next.js template for Follow Up Boss embedded forms with MUI and `@baraagency/components`. Use GitHub's **Use this template** button to start a new project from this repo.

## What's included

- Form router (`/forms`) with FUB embedded context verification
- Pending form example (`/forms/pending`) — multi-step intake UI
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
2. Register the form in `FormRouterClient.tsx`
3. Add `POST /api/forms/<your-slug>/submit` returning a mock success payload
4. Import shared UI from `app/forms/_core/` only

See [docs/adding-a-form.md](docs/adding-a-form.md).

## Customize branding

- Replace `public/form-banner.svg` with your logo (PNG/SVG also work — update `FORM_BANNER_SRC` in `app/forms/_core/FormBanner.tsx`).
- Adjust colors and typography in `app/globals.css` (`:root` design tokens).

## Scripts

| Command | Purpose |
|---------|---------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun test app` | Unit tests |
| `bun run test:e2e` | Playwright smoke tests |
| `bun run dev:fub-context` | Print signed `/forms?context=...&signature=...` |
