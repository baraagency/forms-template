# Adding a Form

1. Copy `app/forms/pending/` to `app/forms/<slug>/`.
2. Rename client component, utils, and tests to match the slug.
3. Add `app/routes/forms.<slug>.tsx` (loader + client) and register `route("forms/<slug>", "routes/forms.<slug>.tsx")` in `app/routes.ts`.
4. Add an entry to `FORM_ROUTER_FORM_REGISTRY` in `app/forms/_core/formRouterFormRegistry.ts` and seed `router_forms`.
5. Add mappable field keys to `app/forms/settings/formFieldCatalog.ts` (+ migration seed) when settings mappings are needed.
6. Create `app/api/forms/<slug>/submit/route.ts` that exports `action`, validates, then calls `runSubmissionWorkflow` from `app/api/_services/submissionWorkflow`. Register the path in `app/routes.ts`.
7. Extend `SubmissionFormType` in `app/forms/_core/submissionUtils.ts` if needed.
8. Update submitted-page labels in `app/routes/forms.submitted.tsx` / `submissionFormLabels` if needed.

Import shared code only from `app/forms/_core/`.

## Page editor (Phase 1: Closed only)

Closed is now document-driven. Its page is a Puck `Data` document seeded in
`app/forms/closed/closedPageDocument.ts` and stored per form in
`form_pages.draft/published` (JSONB). The published document is rendered by
`app/forms/editor/PageRenderer.tsx`; the admin editor lives at
`/forms/closed/edit` behind `ADMIN_PASSWORD` plus the settings admin cookie.

- Field identity is `props.id`; for Closed those ids match the existing
  `ClosedFormState` keys so current SISU/FUB mapping rows keep working.
- `visibleWhen` rules are evaluated in the browser and again by
  `buildClosedSubmission`; hidden values are dropped before the workflow.
- Publishing snapshots SISU options into `props.options`. Public pages never
  call SISU for options.
- New fields added in the editor submit through the doc-aware route, but
  cannot be mapped to SISU/FUB until Phase 3.
- Appointment Set, Appointment Met, and Pending still use the steps above.
  Creating brand-new forms in the editor is Phase 4.
