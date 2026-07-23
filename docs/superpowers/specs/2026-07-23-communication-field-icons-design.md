# Communication field icons

**Date:** 2026-07-23  
**Status:** Implemented  
**Visual choices:** Scope **C** · Icon style **A** (muted outline, inside field padding)

## Problem

Email and phone inputs across forms look identical to other text fields. Agents and users must read labels to distinguish contact fields. We want a consistent left-side communication icon on every email/phone input without changing validation, prefill, or submission behavior.

## Goals

- Show a left-aligned icon inside every communication-related `TextInput` on example forms and in Settings recipients.
- Match approved visual: muted outline icons (Feather-style from [icon-pack.com Communication](https://icon-pack.com/categories/communication)), soft gray-navy stroke, inside existing field padding and shadow.
- Centralize implementation in `app/forms/_core/` so new forms inherit the pattern.
- Preserve accessibility: icon decorative (`aria-hidden`); label + input remain the accessible name.

## Non-goals

- Icons on non-communication fields (address, names, amounts, tags, mapping search)
- Changing `@baraagency/components` `TextInput` source
- Animated icons or sky-tinted icon slots (style B/C were rejected)
- New npm icon dependency (vendor SVG paths from icon-pack’s Feather collection)

## Scope (confirmed)

| Area | Fields |
|------|--------|
| Pending | Client Phone, Client Email, Secondary Client Phone/Email, Loan Officer Email, Coop Agent Phone/Email |
| Appointment Set | Client Phone, Client Email |
| Appointment Met | Client Phone, Client Email |
| Settings | Add recipient email, per-row recipient email edit |

**Total:** 14 inputs across 4 client files.

## Approaches considered

| Approach | Summary | Verdict |
|----------|---------|---------|
| **A. `_core` wrapper component** | `CommunicationTextInput` wraps `TextInput`, adds icon + padding via CSS | **Recommended** — matches template `_core` pattern; one place for styling |
| B. CSS-only `data-type` attrs | Global CSS `::before` on inputs by `type` | Rejected — pseudo-elements on inputs are brittle; no SVG control |
| C. Per-form inline markup | Duplicate icon wrapper at each call site | Rejected — 14 copies; hard to keep consistent |

## Design

### Components

```
app/forms/_core/
├── communicationIcons.tsx      # PhoneIcon, EmailIcon (inline SVG, Feather from icon-pack)
├── CommunicationTextInput.tsx  # Wrapper around TextInput
└── __tests__/CommunicationTextInput.test.tsx
```

**`CommunicationTextInput`**

- Props: same as `TextInput` from `@baraagency/components`, plus optional `communicationKind?: "email" | "phone"` (defaults from `type`: `email` → email, `tel` → phone).
- Structure:

```tsx
<div className="communication-input">
  <span className="communication-input__icon" aria-hidden="true">{icon}</span>
  <TextInput {...props} className="communication-input__control" />
</div>
```

- Passes through `label`, `id`, `hint`, `required`, `wrapperClassName`, and all native input attrs unchanged.

**Icons**

- Source: Feather collection on icon-pack (`phone`, `mail` — communication category).
- Vendored as React SVG components (18×18, `stroke="currentColor"`, `fill="none"`, `strokeWidth={2}`, `strokeLinecap="round"`, `strokeLinejoin="round"`).
- Comment in file cites icon-pack + Feather as source for future updates.

### CSS (`app/globals.css`)

```css
.communication-input {
  position: relative;
}

.communication-input__icon {
  position: absolute;
  left: 14px;
  top: calc(var(--communication-input-icon-top, 50%)); /* align to control, not label */
  transform: translateY(-50%);
  color: color-mix(in srgb, var(--palette-2) 42%, #ffffff);
  pointer-events: none;
  z-index: 1;
}

.communication-input .communication-input__control .bara-input {
  padding-left: 2.75rem; /* room for 18px icon + gap */
}
```

Icon vertical alignment accounts for label above control: wrapper positions icon relative to the input box (below label row), not the full field block. Implementation uses flex or `top` offset matching `.bara-field` label height (~label row + gap).

Focus/hover/error states unchanged — icon color stays muted (does not switch to sky on focus).

### Call-site migration

Replace `TextInput` with `CommunicationTextInput` only where `type="email"` or `type="tel"`:

- `app/forms/pending/PendingFormClient.tsx` (7)
- `app/forms/appointment-set/AppointmentSetFormClient.tsx` (2)
- `app/forms/appointment-met/AppointmentMetFormClient.tsx` (2)
- `app/forms/settings/GmailAndRecipientsPanels.tsx` (2)

Import from `../_core/CommunicationTextInput` (or `./_core/...` per file depth).

### Testing

- Unit test: renders phone icon for `type="tel"`, mail icon for `type="email"`; preserves label/id; icon has `aria-hidden`.
- Manual: spot-check Pending client section + Settings recipients on mobile width (icon not clipped, padding readable).

### Documentation

- No Notion visual-design page change required (field adornment, not token change).
- Optional one-line note in `.interface-design/system.md` under Forms UI if a forms patterns section exists.

## Error handling

None — presentational only; no new runtime failure modes.

## Rollout

Single PR: add `_core` pieces, CSS, migrate 14 call sites, add test.
