# Adding a Form

1. Copy `app/forms/pending/` to `app/forms/<slug>/`.
2. Rename client component, utils, and tests to match the slug.
3. Add an entry to `availableForms` in `FormRouterClient.tsx`.
4. Create `app/api/forms/<slug>/submit/route.ts` that validates and returns mock success JSON.
5. Extend `SubmissionFormType` in `app/forms/_core/submissionUtils.ts` if needed.
6. Update `app/forms/submitted/page.tsx` labels if the new form uses the shared confirmation page.

Import shared code only from `app/forms/_core/`.
