import { FormsSettingsClient } from "./FormsSettingsClient";
import { listRouterForms } from "@/app/api/_services/routerFormsRepo";
import { getGmailStatusForCurrentEnvironment } from "@/app/api/_services/gmailOAuthService";
import { FORM_ROUTER_FORM_REGISTRY } from "../_core/formRouterFormRegistry";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FormsSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const gmail = firstParam(params.gmail);
  const message = firstParam(params.message);

  let gmailFlash: { tone: "success" | "warning"; message: string } | null =
    null;
  if (gmail === "connected") {
    gmailFlash = {
      tone: "success",
      message: "Gmail connected for this environment.",
    };
  } else if (gmail === "error") {
    gmailFlash = {
      tone: "warning",
      message: message || "Gmail connection failed.",
    };
  }

  const [routerResult, gmailStatus] = await Promise.all([
    listRouterForms(),
    getGmailStatusForCurrentEnvironment(),
  ]);

  const fallbackRouterForms = FORM_ROUTER_FORM_REGISTRY.map((form) => ({
    slug: form.key,
    name: form.title,
    visible: true,
  }));

  return (
    <FormsSettingsClient
      initialRouterForms={routerResult.data ?? fallbackRouterForms}
      initialGmailStatus={gmailStatus.data}
      gmailFlash={gmailFlash}
    />
  );
}
