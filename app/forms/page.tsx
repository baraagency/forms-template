import { FormRouterClient } from "./FormRouterClient";
import { isLocalFormsDemoEnvironment } from "./_core/localFormsDemo";

export default function FormsPage() {
  const localDemoEnabled = isLocalFormsDemoEnvironment(process.env.ENVIRONMENT);

  return <FormRouterClient localDemoEnabled={localDemoEnabled} />;
}
