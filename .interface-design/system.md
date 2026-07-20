# Interface Design System — Forms Template

## Direction and feel

Ops settings for real-estate form workflows (SISU + Follow Up Boss). Calm, dense enough for mapping tables, quiet elevation — not a marketing dashboard. Agent/admin configuring router visibility, email, and field mappings between desk work.

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

- Face: **Lato** (baraagency.com) via Google Fonts link in `app/root.tsx` — weights 300 / 400 / 700 / 900 only
- Display / page titles: weight 900, uppercase, wide tracking (`--page-title-tracking`)
- Section titles: weight 900, slight negative tracking (`--section-title-tracking`)
- Labels / eyebrows: weight 700; eyebrows use wide tracking (`--eyebrow-tracking`) when uppercase
- Body: weight 400, line-height ~1.625
- Descriptions: italic body color, `text-wrap: pretty`, max-width ~620px
- Field codes: compact monospace-ish via `<code>`, overflow-wrap anywhere
- Dynamic / status numbers: `font-variant-numeric: tabular-nums`
- Root: `-webkit-font-smoothing: antialiased` (globals)

## Motion

- Press feedback: `scale(0.96)` only (never below 0.95)
- Transitions: specific properties (`transform`, `color`, etc.) — never `transition: all`
- Easing: decelerating cubic-bezier (~`0.23, 1, 0.32, 1`) for tabs/toggles
- Respect `prefers-reduced-motion`

## Hit areas

Interactive controls (pagination, toggles, icon buttons) ≥ **40×40px**.

---

## Patterns

### Settings form tabs

- File: `app/forms/settings/settings-tabs.css`
- 4-column grid of tabs; sliding indicator under active tab
- Active: foreground color; press: `scale(0.96)`

### Mapping table (SISU / FUB)

- Shared layout: search → optional loading hint → MUI table (5 rows/page) → pagination with tabular nums
- Columns: Form field (label + `field_name` code) → target Select → Save (primary only when dirty)
- Cleared SISU / FUB field = `enabled: false` on save; selecting a field = `enabled: true`
- SISU: also Type + Custom (auto from team-fields catalog)
- FUB person/deal: Select options = top-level keys from one sample (`/api/fub/people?fields=allFields&limit=1`, `/api/fub/deals?fields=allFields&limit=1`). Person sample uses live FUB when `FUB_API_KEY` is set; otherwise fixture.
- SISU field Select: live `/api/sisu/team-fields` when `SISU_API_KEY` is set; otherwise fixture
- Components: `SisuMappingsTable.tsx`, `FubMappingsTable.tsx`

### FUB Person / FUB Deal blocks

- File: `FormSettingsPanel.tsx` (+ `FubStagePicker.tsx`, `FubMappingsTable.tsx`)
- Two peer sections after SISU mappings — not a single “FUB stages” list
- **FUB Person:** Stage → Tags → Mappings
- **FUB Deal:** Stage → Mappings (no Tags)
- Subsections use `.settings-fub-subsection` inset surface (see Depth)
- Person stages: flat list from `/api/fub/stages`
- Deal stages: from `/api/fub/pipelines` nested stages; display label `Pipeline · Stage` (SelectInput flattens optgroups)
- Desired stage: one row per form+target (`client_type` null); save immediately on Select change via `PUT /api/forms/settings/fub/stages`

### Pill toggle

- 40×24 track, 18px thumb; checked uses `--palette-2`
- Press: track `scale(0.96)`

### Settings section rhythm

- `.settings-section` gap 14px; adjacent sections get top border + 24px padding-top
- No decorative “FUB note” / env explainer cards — credentials stay in env docs, not the UI

### Per-form email recipients

- Lives inside each form tab (`FormRecipientsPanel`), not the shared Email card
- DB: `form_email_recipients.form_type` (text FormKind); emails are **not** unique
- List/create via `/api/forms/settings/recipients?form=` / `form_type` in POST body
- Row UI: editable email + Save (when dirty) + Remove; add form sits above the list
- No Active toggle — remove a recipient to stop sending to them
