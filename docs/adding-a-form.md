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
