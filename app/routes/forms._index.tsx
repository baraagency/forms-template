import { FormRouterClient } from "../forms/FormRouterClient";
import { isFormsDemoMode } from "../forms/_core/localFormsDemo";
import { listVisibleFormRouterForms } from "@/app/api/_services/routerFormsRepo";
import type { Route } from "./+types/forms._index";

export async function loader(_args: Route.LoaderArgs) {
  const localDemoEnabled = isFormsDemoMode(process.env.DEMO_MODE);
  const { forms, warning } = await listVisibleFormRouterForms();
  return {
    localDemoEnabled,
    availableForms: forms,
    visibilityWarning: warning,
  };
}

export default function FormsIndex({ loaderData }: Route.ComponentProps) {
  return (
    <FormRouterClient
      localDemoEnabled={loaderData.localDemoEnabled}
      availableForms={loaderData.availableForms}
      visibilityWarning={loaderData.visibilityWarning}
    />
  );
}
