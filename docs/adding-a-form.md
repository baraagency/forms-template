# Adding a Form

1. Copy `app/forms/pending/` to `app/forms/<slug>/`.
2. Rename client component, utils, and tests to match the slug.
3. Add an entry to `FORM_ROUTER_FORM_REGISTRY` in `app/forms/_core/formRouterFormRegistry.ts` and seed `router_forms`.
4. Add mappable field keys to `app/forms/settings/formFieldCatalog.ts` (+ migration seed) when settings mappings are needed.
5. Create `app/api/forms/<slug>/submit/route.ts` that validates and returns mock success JSON.
6. Extend `SubmissionFormType` in `app/forms/_core/submissionUtils.ts` if needed.
7. Update `app/forms/submitted/page.tsx` labels if the new form uses the shared confirmation page.

Import shared code only from `app/forms/_core/`.
