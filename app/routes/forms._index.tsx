import { FormRouterClient } from "../forms/FormRouterClient";
import { isLocalFormsDemoEnvironment } from "../forms/_core/localFormsDemo";
import { listVisibleFormRouterForms } from "@/app/api/_services/routerFormsRepo";
import type { Route } from "./+types/forms._index";

export async function loader(_args: Route.LoaderArgs) {
  const localDemoEnabled = isLocalFormsDemoEnvironment(process.env.ENVIRONMENT);
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
