# Interface Design System — Forms Template

**Canonical Notion doc:** [Interface Design System](https://app.notion.com/p/3d8a4516f72b81ffaff9cfdf161072f7) — keep in sync when tokens or patterns change.

## Direction and feel

Ops settings for real-estate form workflows (SISU + Follow Up Boss). Calm, dense enough for mapping tables, quiet elevation — not a marketing dashboard. Agent/admin configuring router visibility, email, and field mappings between desk work.

## Color (baraagency.com)

Primitive hex values: `tokens/primitives.json` → `bun run tokens:build` → `app/generated/design-tokens.css` (consumed by `globals.css` + `AppTheme.tsx`).

| Token | Hex | Role |
| --- | --- | --- |
| `--palette-1` | `#1E1E1E` | Near-black accent / primary CTAs |
| `--palette-2` | `#003A55` | Deep navy text & structure |
| `--palette-3` | `#404040` | Charcoal errors |
| `--brand-sky` | `#0099CC` | Brand blue (focus, outlines, success tint) |
| `--background` | `#F0F7FA` | Cool blue-tinted page wash |

Keep Lato; prefer CSS variables over hard-coded hex in components.

## Depth strategy

**Layered subtle shadows + low-opacity edge rings** (not harsh solid borders).

- Page / section cards: existing `--card-border` / `--card-bg`
- Nested FUB subsections: tinted surface + whisper ring + soft lift:
  - `background: color-mix(in srgb, var(--card-bg) 92%, var(--body-color))`
  - `box-shadow: 0 0 0 1px color-mix(..., 10%), 0 1px 2px color-mix(..., 6%)`
- Mapping tables: thin `color-mix` border on container, no heavy drop shadow

Do not mix in dramatic multi-layer card shadows or pure white cards on tinted grounds.

## Spacing base unit

**4px.** Prefer multiples of 4 / 8.

| Context | Typical |
| --- | --- |
| Micro (label → code gap) | 2–4px |
| Component (subsection padding, table gaps) | 12–16px |
| Subsection stack | 18–20px |
| Section / page stack | 24px |

## Typography

- Body face: **Lato** (baraagency.com) via Google Fonts in `app/root.tsx` — weights 300 / 400 / 700 / 900
- Headers / display: **DM Serif Display** via `--font-display` — page titles and container (`SectionCard`) headers only on settings; nested settings section / subsection titles use Lato weight 700
- Display / page titles: uppercase, wide tracking (`--page-title-tracking`)
- Section titles (forms): slight negative tracking (`--section-title-tracking`) on container headers
- Labels / eyebrows: Lato weight 700; eyebrows use wide tracking (`--eyebrow-tracking`) when uppercase
- Body: weight 400, line-height ~1.625
- Descriptions: italic body color, `text-wrap: pretty`, max-width ~620px
- Field codes: compact monospace-ish via `<code>`, overflow-wrap anywhere
- Dynamic / status numbers: `font-variant-numeric: tabular-nums`
- Root: `-webkit-font-smoothing: antialiased` (globals)

## Motion

- Press feedback: `scale(0.96)` / `var(--scale-large)` only (never below 0.95)
- Transitions: specific properties (`transform`, `color`, etc.) — never `transition: all`
- Shared tokens: `app/component-transitions.css` (`--duration-*`, `--ease-smooth-out`, `--distance-*`, `--scale-*`, `--blur-*`)
- Easing: `--ease-smooth-out` (`cubic-bezier(0.22, 1, 0.36, 1)`) for surface motion
- Focus / hover accents: `--brand-sky` / `--brand-sky-soft` (not the primary CTA fill) so CTAs stay the only black moments
- Primary CTAs (form launch, Submit, Create New Deal, settings saves): shared solid black fill + 2px border via `.form-router-launch-button` / `.bara-button--primary`
- Select menus: open `--duration-fast` fade+scale; close is the reverse at `--duration-quick` (slightly faster) via `.bara-select__menu--closing`
- Respect `prefers-reduced-motion`

## Hit areas

Interactive controls (pagination, toggles, icon buttons) ≥ **44×44px** on coarse pointers (`pointer: coarse`); **40×40px** minimum on fine pointers.

## Breakpoints

Central tokens in `app/globals.css`:

| Token | Value | Usage |
| --- | --- | --- |
| `--bp-sm` | `640px` | Phone landscape, stacked settings actions |
| `--bp-md` | `768px` | Page padding tighten |
| `--bp-lg` | `900px` | Mapping tables → card layout |
| `--bp-form-cols` | `700px` | 2-col form rows (container query) |

## Contrast (WCAG 2.1 AA)

Verified pairs — run `bun run test:a11y:contrast` after token changes.

| Foreground token | Background | Minimum | Notes |
| --- | --- | --- | --- |
| `--foreground` / `--label-color` | `--card-bg` | 4.5:1 | Primary labels |
| `--body-color` | `--card-bg` / `--background` | 4.5:1 | Body copy (`#4a6b7c`) |
| `--placeholder-color` | `--card-bg` | 4.5:1 | Input placeholders (`#5a7585`) |
| `--error-color` | `--card-bg` | 4.5:1 | Field errors |
| `--btn-primary-color` | `--btn-primary-bg` | 4.5:1 | Primary CTAs |
| `--icon-muted` | `--card-bg` | 4.5:1 | Decorative-adjacent icons |
| Section titles (18pt+) | `--card-bg` | 3:1 | Large text |
| `--field-focus-ring` | `--card-bg` | 3:1 | Focus indicator vs adjacent |

Prefer darkening `color-mix` tokens over changing brand hues when a pair fails.

---

## Patterns

### Settings form tabs

- File: `app/forms/settings/settings-tabs.css`
- Form-level: 4-column grid of tabs; sliding indicator under active tab
- Nested mapping destinations: `.settings-tabs--3` (SISU | FUB Person | FUB Deal) inside one **Field mappings** section
- Active: foreground color; press: `scale(0.96)`
- Inactive mapping panels stay mounted (`hidden`) so draft mapping edits survive tab switches
- No panel enter animation on destination switch (frequent ops action — keep instant)

### Mapping table (SISU / FUB)

- Shared layout: search + Save mappings (same row) → fixed-height MUI table with **internal scroll** (not page scroll)
- **Viewport:** ~5 visible body rows + sticky header; container height fixed via `--settings-mapping-table-height` in `settings-tabs.css` — page height must not grow as rows load
- **Infinite scroll (not pagination):** initial 10 rows (`MAPPING_TABLE_BATCH_SIZE`); load 10 more near scroll bottom; search/filter resets to first 10 and scrolls to top; no pagination controls
- **DOM:** `TableContainer.settings-mapping-table-container` (fixed height, `overflow: hidden`) → `.settings-mapping-table-scroll` (`overflow-y: auto`, **`contain: strict`**) → MUI `Table`
- **Scroll containment (required):** `contain: strict` on `.settings-mapping-table-scroll` prevents tall table content from leaking into document scroll height
- **Hidden panels:** destination tabs and form tabs stay mounted (`hidden`) for draft persistence — auto-load must skip when `clientHeight === 0` so hidden tables do not prefetch the full dataset
- **Loading:** in-table skeleton rows (5) while catalog loads; no spinner above table; skeletons must not resize the outer container
- Row order: form-field appearance order from `formFieldCatalog.ts` (`FORM_FIELD_OPTIONS` array order), not A–Z `field_name`
- Columns: Form field (label only) → target Select (+ SISU Type / Custom)
- No per-row Actions column — edit freely, then **Save mappings** beside search commits all dirty rows
- Status under the Save button: “No unsaved changes” or “N unsaved change(s)”; primary CTA only when dirty
- Cleared SISU / FUB field = `enabled: false` on save; selecting a field = `enabled: true`
- SISU: also Type + Custom (auto from team-fields catalog)
- FUB person/deal: Select options = top-level keys from one sample (`/api/fub/people?fields=allFields&limit=1`, `/api/fub/deals?fields=allFields&limit=1`). Person sample uses live FUB when `FUB_API_KEY` is set; otherwise fixture.
- SISU field Select: live `/api/sisu/team-fields` when `SISU_API_KEY` is set; otherwise fixture
- Components: `SisuMappingsTable.tsx`, `FubMappingsTable.tsx`, `useMappingTableInfiniteScroll.ts`, `settings-tabs.css`

### FUB Person / FUB Deal (mapping tabs)

- File: `FormSettingsPanel.tsx` (+ `FubStagePicker.tsx`, `FubMappingsTable.tsx`)
- Live inside **Field mappings** destination tabs — not stacked peer sections
- **FUB Person** tab: Stage → Tags → Mappings
- **FUB Deal** tab: Stage → Mappings (no Tags)
- Subsections use `.settings-fub-subsection` inset surface (see Depth)
- Person stages: flat list from `/api/fub/stages`
- Deal stages: from `/api/fub/pipelines` nested stages; display label `Pipeline · Stage` (SelectInput flattens optgroups)
- Desired stage: one row per form+target+`client_type` (`Buyer` / `Seller`); save immediately on Select change via `PUT /api/forms/settings/fub/stages`
- Person tags: separate Buyer / Seller lists (`client_type` on `form_fub_tags`)

### Pill toggle

- 40×24 track, 18px thumb; checked uses `--palette-2`
- Press: track `scale(0.96)`

### Settings section rhythm

- `.settings-section` gap 14px; adjacent sections get top border + 24px padding-top
- No decorative “FUB note” / env explainer cards — credentials stay in env docs, not the UI
- Back to Form Router: fixed top-left (`settings-back-link`, 16px inset, z-index 40)

### Per-form email recipients

- Lives inside each form tab (`FormRecipientsPanel`), not the shared Email card
- DB: `form_email_recipients.form_type` (text FormKind); emails are **not** unique
- List/create via `/api/forms/settings/recipients?form=` / `form_type` in POST body
- Row UI: editable email + Save (when dirty) + Remove; add form sits above the list
- No Active toggle — remove a recipient to stop sending to them
