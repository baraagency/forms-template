import { lazy, Suspense } from "react";
import {
  formKindLabel,
  parseFormKindParam,
} from "../forms/_core/formIdentity";
import { CLOSED_PAGE_DOCUMENT } from "../forms/closed/closedPageDocument";
import { APPOINTMENT_SET_PAGE_DOCUMENT } from "../forms/appointment-set/appointmentSetPageDocument";
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
  if (form !== "closed" && form !== "appointmentSet") {
    throw new Response("Not Found", { status: 404 });
  }

  const fallback =
    form === "closed"
      ? CLOSED_PAGE_DOCUMENT
      : APPOINTMENT_SET_PAGE_DOCUMENT;
  const page = await loadDraftFormPage(form, fallback);

  return {
    form,
    formLabel: formKindLabel(form),
    document: page.data,
    version: page.version,
  };
}

export default function PageEditorRoute({ loaderData }: Route.ComponentProps) {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-sm text-[var(--muted-foreground)]">
        Loading editor…
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center text-sm text-[var(--muted-foreground)]">
          Loading editor…
        </main>
      }
    >
      <PuckPageEditor
        form={loaderData.form}
        formLabel={loaderData.formLabel}
        document={loaderData.document}
        version={loaderData.version}
      />
    </Suspense>
  );
}
