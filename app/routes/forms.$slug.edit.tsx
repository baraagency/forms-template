import { lazy, Suspense } from "react";
import {
  formKindLabel,
  parseFormKindParam,
} from "../forms/_core/formIdentity";
import { Spinner } from "../forms/_core/ui";
import { CLOSED_PAGE_DOCUMENT } from "../forms/closed/closedPageDocument";
import { APPOINTMENT_SET_PAGE_DOCUMENT } from "../forms/appointment-set/appointmentSetPageDocument";
import { APPOINTMENT_MET_PAGE_DOCUMENT } from "../forms/appointment-met/appointmentMetPageDocument";
import { PENDING_PAGE_DOCUMENT } from "../forms/pending/pendingPageDocument";
import { canEditFormPages } from "@/app/api/_services/settingsAdminAuth";
import { loadDraftFormPage } from "@/app/api/_services/formPageService";
import { useIsMounted } from "../forms/_core/useIsMounted";
import type { Route } from "./+types/forms.$slug.edit";

const PuckPageEditor = lazy(() =>
  import("../forms/editor/PuckPageEditor").then((module) => ({
    default: module.PuckPageEditor,
  })),
);

export async function loader({ request, params }: Route.LoaderArgs) {
  if (!canEditFormPages(request)) {
    throw new Response("Not Found", { status: 404 });
  }

  const form = parseFormKindParam(params.slug);
  if (
    form !== "closed" &&
    form !== "appointmentSet" &&
    form !== "appointmentMet" &&
    form !== "pending"
  ) {
    throw new Response("Not Found", { status: 404 });
  }

  const fallback =
    form === "closed"
      ? CLOSED_PAGE_DOCUMENT
      : form === "appointmentSet"
        ? APPOINTMENT_SET_PAGE_DOCUMENT
        : form === "appointmentMet"
          ? APPOINTMENT_MET_PAGE_DOCUMENT
          : PENDING_PAGE_DOCUMENT;
  const page = await loadDraftFormPage(form, fallback);

  return {
    form,
    formLabel: formKindLabel(form),
    document: page.data,
    version: page.version,
  };
}

function LoadingEditor() {
  return (
    <>
      <title>Page Editor</title>
      <main
        id="main-content"
        tabIndex={-1}
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="flex min-h-dvh flex-col items-center justify-center gap-3 text-sm text-[var(--body-color)]"
      >
        <Spinner />
        Loading editor…
      </main>
    </>
  );
}

export default function PageEditorRoute({ loaderData }: Route.ComponentProps) {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return <LoadingEditor />;
  }

  return (
    <Suspense fallback={<LoadingEditor />}>
      <PuckPageEditor
        form={loaderData.form}
        formLabel={loaderData.formLabel}
        document={loaderData.document}
        version={loaderData.version}
      />
    </Suspense>
  );
}
