import { FormsSettingsClient } from "../forms/settings/FormsSettingsClient";
import { SettingsLoginPanel } from "../forms/settings/SettingsLoginPanel";
import { listRouterForms } from "@/app/api/_services/routerFormsRepo";
import { getGmailStatusForCurrentEnvironment } from "@/app/api/_services/gmailOAuthService";
import {
  isSettingsAdminAuthenticated,
  isSettingsAdminPasswordConfigured,
} from "@/app/api/_services/settingsAdminAuth";
import { FORM_ROUTER_FORM_REGISTRY } from "../forms/_core/formRouterFormRegistry";
import type { Route } from "./+types/forms.settings";

export async function loader({ request }: Route.LoaderArgs) {
  const requiresAuth = isSettingsAdminPasswordConfigured();
  const isAuthenticated = isSettingsAdminAuthenticated(request);

  if (requiresAuth && !isAuthenticated) {
    return {
      requiresAuth,
      isAuthenticated,
      initialRouterForms: [],
      initialGmailStatus: null,
      gmailFlash: null,
    };
  }

  const url = new URL(request.url);
  const gmail = url.searchParams.get("gmail") ?? undefined;
  const message = url.searchParams.get("message") ?? undefined;

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

  return {
    requiresAuth,
    isAuthenticated,
    initialRouterForms: routerResult.data ?? fallbackRouterForms,
    initialGmailStatus: gmailStatus.data,
    gmailFlash,
  };
}

export default function FormsSettings({ loaderData }: Route.ComponentProps) {
  if (loaderData.requiresAuth && !loaderData.isAuthenticated) {
    return <SettingsLoginPanel />;
  }

  return (
    <FormsSettingsClient
      initialRouterForms={loaderData.initialRouterForms}
      initialGmailStatus={loaderData.initialGmailStatus}
      gmailFlash={loaderData.gmailFlash}
    />
  );
}
