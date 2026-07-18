import { FormRouterClient } from "./FormRouterClient";
import { isLocalFormsDemoEnvironment } from "./_core/localFormsDemo";
import { listVisibleFormRouterForms } from "@/app/api/_services/routerFormsRepo";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const localDemoEnabled = isLocalFormsDemoEnvironment(process.env.ENVIRONMENT);
  const { forms, warning } = await listVisibleFormRouterForms();

  return (
    <FormRouterClient
      localDemoEnabled={localDemoEnabled}
      availableForms={forms}
      visibilityWarning={warning}
    />
  );
}
