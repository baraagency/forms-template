# Phase 2 — field type audit

**Date:** 2026-10-27  
**Scope:** Appointment Set, Appointment Met, Pending (Closed is already migrated).

## What each form uses

| Control | Appointment Set | Appointment Met | Pending |
| --- | --- | --- | --- |
| Text | client names, street, address 2, city, postal | client names | client names, address, city, postal, mortgage company name, loan officer name, referral mailing address, coop agent name/company |
| Textarea | notes | notes, follow-up notes | notes, contingency details |
| Phone | client phone | client phone | client phone, secondary phone, coop agent phone |
| Email | client email | client email | client email, secondary email, loan officer email, coop agent email |
| Currency | — | — | transaction amount, referral amount |
| Percentage | — | — | referral percent, seller compensation percent |
| Date | appointment date | appointment met date, rescheduled date | under contract date, forecasted closed date, due diligence deadline |
| Time | start time, end time | rescheduled start/end time | — |
| Single choice | client type, set by, appointment type, location, state | client type, disposition, outcome, next step, cancelled next step | client type, secondary client, financing, mortgage company, outside referral, due diligence, contingencies, state |
| Boolean (yes/no) | — | — | represented as choice with `yes`/`no` values to preserve legacy payloads |
| Multi-select | — | — | — |

Conditional reveals:

- Appointment Set: ISA/OSA depending on “Appointment Set By”; address fields when location is “Other Address”.
- Appointment Met: Met / Cancelled / Rescheduled branches; follow-up notes when cancelled next step is “Other”.
- Pending: secondary client; mortgage “Other” details; referral details; seller-only due diligence/contingencies; due-diligence deadline and contingency details when “yes”.

## Dynamic option sources

| Source | Used by | Notes |
| --- | --- | --- |
| Manual | most selects | values and labels stored in the document |
| SISU team fields | Pending client type/financing/yes-no fields; Closed transaction type | snapshot on publish |
| SISU team agents | Appointment Set assigned ISA (`role_filter=ISISA`) | snapshot on publish |
| SISU vendors | Pending mortgage company (`mortgageCompany` group) | snapshot on publish |
| FUB users | Appointment Set assigned OSA | snapshot on publish |
| FUB appointment types | Appointment Set appointment type | snapshot on publish |
| US states | address state fields | built-in preset |

## Gaps found and closed in Phase 2

1. `time` field kind did not exist.
2. `percentage` field kind did not exist (Pending referral/seller compensation).
3. Dynamic option sources for SISU agents, SISU vendors, FUB users, and FUB appointment types did not exist.
4. Phone/email fields did not use the shared communication icon control.
5. Dynamic selects could not render disabled when their catalog was unavailable.
6. Boolean fields had no dropdown variant (legacy Pending yes/no fields use selects; migrated fields will use `choice` with their existing values, not the boolean kind).

## Pending-specific note

Pending keeps legacy mapped fields that are no longer rendered (for example `agent2`, `office`, `commissionDelivery`). Those stay in the Pending form state and submission hook; the page document only contains rendered fields. That preserves existing mapping rows without requiring hidden editor blocks.
