# Puck page editor

**Date:** 2026-10-27  
**Status:** Implemented (Phase 2)  
**Decision:** Use Puck (`@puckeditor/core`) as the editing UI. Keep the persisted page document and the public renderer independent of Puck so the editor can be replaced without rewriting stored pages.

## Problem

Form pages are hand-written JSX. Changing copy, reordering fields, adding a field, or changing a conditional rule requires a code change and deploy. Admins need to edit a form page from the page itself, save drafts, and publish, without S3 or a hosted CMS.

The earlier craft.js evaluation is in `docs/page-editor-alternatives.md`. Puck is the maintained option that fits React 19, React Router 8, our own components, and JSON in Postgres.

## Goals

- Admin-only editor at `/forms/:slug/edit`, opened from a button fixed to the bottom-right of the form page.
- Blocks: page title, section header, divider, plain text, field.
- Field kinds: text (single or multiline), phone, email, number, currency, true/false, choice (radio or select), multi-select checkbox, date.
- Field settings: label, tooltip, required, placeholder, options, visibility rules.
- Options: manual, US states preset, or SISU team-field catalog.
- Draft autosave and explicit publish, stored in Postgres `jsonb`. No S3.
- Public pages render from the published document without loading Puck.
- Closed form keeps its current behavior: prefill, draft cache, SISU/FUB submission, past-date rule, lease/rental conditionals, submitted page.
- WCAG 2.1 AA on published forms.

## Non-goals for Phase 1

- Creating new forms (dynamic route + `router_forms` row).
- Moving SISU/FUB mapping tables into the editor; Phase 1 links to the existing Settings mappings. New fields added in Phase 1 are stored and submitted, but cannot be mapped to SISU/FUB until Phase 3.
- Migrating Appointment Set, Appointment Met, or Pending.
- Rich text, images/media, columns/containers, version history, collaboration.
- Multi-column layout. Fields stack full width; the current Closed rows become stacked in Phase 1.

## Decisions

1. **Puck, not craft.js.** Puck is maintained, React 19-ready, MIT, and emits plain JSON. Trade-off: it owns the editor UI and is pre-1.0 (0.23).
2. **The stored document is ours.** Persist Puck `Data` shape (`content`, `root`) but render it with `PageRenderer`, not Puck `<Render>`. `@puckeditor/core` is imported only by the lazy editor route.
3. **Flat blocks.** No zones or nesting. One block = one component. This keeps visibility, validation, rendering, and migration simple.
4. **Field identity is `props.id`.** Puck generates it on insert and regenerates it on duplicate, so it is unique and stable. Labels are not keys. Seeded Closed fields use their existing keys (`clientType`, `transactionAmount`, …) so existing mapping rows keep working.
5. **SISU options are snapshotted on publish.** The document stores `optionSource: "sisu"` + `sisuFieldKey`; publish resolves the catalog into `props.options`. Public rendering and validation never call SISU.
6. **Visibility is data, not code.** `visibleWhen` rules are evaluated in the browser and again on the server. Hidden fields are excluded from validation and from the submitted payload.
7. **Strict admin gate.** Editor pages and write APIs require `ADMIN_PASSWORD` to be configured and a valid settings admin cookie. Unlike Settings, no password does **not** mean open access.
8. **Optimistic concurrency.** Every write sends the version it read; stale writes get `409` and the editor reloads.
9. **Fallbacks are explicit.** With no published row or invalid published JSON, the public loader uses the code default document. Page and submit use the same loader so they always agree.

## Data model

```sql
CREATE TABLE IF NOT EXISTS form_pages (
  form TEXT PRIMARY KEY,
  draft JSONB NOT NULL,
  published JSONB,
  schema_version INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_form_pages_published_at
  ON form_pages (published_at DESC NULLS LAST);
```

Document shape:

```ts
type FormPageData = {
  content: Array<{ type: PageBlockType; props: { id: string } & Record<string, unknown> }>;
  root: { props: Record<string, unknown> };
  zones?: Record<string, never>; // rejected when non-empty
};

type PageBlockType = "PageTitle" | "SectionHeader" | "Divider" | "TextBlock" | "FieldBlock";
```

Field props:

```ts
type FieldKind =
  | "text" | "phone" | "email" | "number" | "currency"
  | "boolean" | "choice" | "multiChoice" | "date";

type FieldOption = { label: string; value: string };

type VisibilityRule = {
  fieldId: string;
  operator: "equals" | "notEquals" | "in" | "isFilled" | "isEmpty";
  values?: string[];
};

type FieldBlockProps = {
  id: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  display?: "radio" | "select";       // choice only
  multiline?: boolean;                // text only
  tooltip?: string;
  placeholder?: string;
  options?: FieldOption[];            // resolved snapshot for choice/multiChoice
  optionSource?: "manual" | "sisu" | "usStates";
  sisuFieldKey?: string;              // required when optionSource = "sisu"
  dateConstraint?: "past" | "future" | "any";
  visibleWhen?: VisibilityRule[];
};
```

Constants: max 200 blocks per document, max 256 KB request body, field ids unique, `visibleWhen` must reference existing field ids and must not contain cycles. Drafts may have choice fields with no options; publish rejects them.

## Rendering

`PageRenderer` walks `content` and renders the matching block component. Static blocks are server-renderable. `FieldBlock` reads form state from `FormRuntimeProvider`; in the Puck canvas it renders a disabled preview because `puck.isEditing` is true.

Field kind → control:

| Kind | Control |
| --- | --- |
| text | `TextInput` (or `TextAreaInput` when `multiline`) |
| phone / email | `TextInput` with `type="tel"` / `type="email"` |
| number | `TextInput` with `inputMode="decimal"` |
| currency | `TextInput` with `$` prefix and `formatCurrencyInput` |
| boolean | Yes/No radio group |
| choice | `FormSelectInput` (`display: "select"`) or radio group |
| multiChoice | checkbox group |
| date | `FormDatePickerField` with `dateConstraint` |

`SectionHeader` renders the existing section title style with a divider under the header, matching the current form convention. `Divider` is a standalone rule. Text is rendered as text, never HTML.

## Validation and submit

1. Load the published document with the same fallback as the page loader.
2. Normalize raw values by kind (trim, arrays, booleans).
3. Drop values for hidden fields.
4. Validate visible fields: required, option membership, number/currency parse, date parse and constraint, email/phone shape.
5. Return errors keyed by field id.
6. Merge routing keys (`personId`, `agentId`, `dealId`, `sisuTransactionId`) and call the existing `runSubmissionWorkflow` for the form.

The server never trusts client-side visibility or required state. A hidden required field must not block submit, and a visible required field must block it even if the client omitted it.

## Editor UX

- Bottom-right "Edit page" link, only when the admin cookie is valid and `ADMIN_PASSWORD` is configured.
- Full-screen Puck editor: component drawer, canvas, fields inspector, publish button.
- Header: form name, "Back to form", autosave status (`Saving…`, `Saved`, `Unsaved changes`, `Conflict`).
- Autosave is debounced (~1 s) and serialized so writes never race. Publish sends the current data and version in one request.
- A 409 shows "This page changed elsewhere" with a reload action; it does not overwrite.
- The editor header includes a "Manage mappings" link to `/forms/settings` in Phase 1; the per-field mapping panel arrives in Phase 3.

## Security

- `enforcePageEditorAdmin` returns 401 when `ADMIN_PASSWORD` is unset or the cookie is invalid.
- The edit route returns 404 to unauthorized users (no discovery).
- Parse and size-limit every document at the API boundary; reject unknown block types, duplicate field ids, invalid visibility references, and non-empty zones.
- Publish resolves SISU options server-side and validates the document for publish.
- Public submit revalidates against the published document; choice values must be in the snapshot.
- No `dangerouslySetInnerHTML`.

## Accessibility

- Labels stay associated via `Field`/`htmlFor`; errors use `FieldError` and `aria-describedby`/`aria-errormessage`.
- Tooltip text is available to assistive tech through `aria-describedby`, not only on hover.
- Required fields use the existing required marker and `required` attribute.
- Validation summary remains `role="alert"`; focus moves to the summary on failed submit.
- Editor: verify Puck's drag handles are keyboard operable. If not, add move up/down actions in the block action bar (follow-up task).

## Phases

| Phase | Scope |
| --- | --- |
| 1 | Foundation + Closed: document model, DB, APIs, blocks, renderer, validation, editor route/button, Closed migration, doc-aware Closed submit |
| 2 | Migrate Appointment Set, Appointment Met, Pending; per-form prefill/submit hooks; generic submit route |
| 3 | Move SISU/FUB mapping UI into the field inspector; remove mapping tabs from Settings |
| 4 | Create-form flow: dynamic `/forms/:slug`, `router_forms` row, wider `FormKind`/`SubmissionFormType`, generic submit |
| 5 | Optional layout blocks (columns/rows) if stacked fields are not acceptable |

## Risks

- Puck is pre-1.0; pin the minor version and keep the document/published renderer independent.
- Migrating Closed is a rewrite of a working page; keep the old client in git until parity is verified (prefill, draft cache, past date, lease conditionals, submit).
- New fields added in the editor only submit correctly once the Closed submit route is document-aware (Phase 1 includes this).
- SISU option snapshots can go stale between publishes; the editor should show the last publish time and a "refresh options on publish" note.
- Removing a field orphans its mapping rows. Phase 1 does not delete them; Phase 3 must prune or warn.
- New fields added in Phase 1 can be submitted but not mapped to SISU/FUB until Phase 3. Document this in the editor so admins do not expect a mapping for a newly added field.
