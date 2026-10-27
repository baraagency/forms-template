import { Link } from "react-router";
import { formKindToSlug, type SettingsFormKind } from "../_core/formIdentity";

/** Admin-only edit affordance. The route and API enforce auth too. */
export function PageEditorButton({ form }: { form: SettingsFormKind }) {
  const slug = formKindToSlug(form);
  if (!slug) {
    return null;
  }

  return (
    <Link
      to={`/forms/${slug}/edit`}
      className="page-editor-button"
      aria-label="Edit this page"
    >
      Edit page
    </Link>
  );
}
