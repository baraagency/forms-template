import { listDealMappings } from "@/app/api/_services/settingsQueries";
import { parseFormKindParam } from "@/app/forms/_core/formIdentity";

export async function loader({ request }: { request: Request }) {
  const form = parseFormKindParam(new URL(request.url).searchParams.get("form"));
  if (!form) {
    return Response.json(
      { message: "Query form is required (FormKind or slug)." },
      { status: 400 },
    );
  }

  const result = await listDealMappings(form);
  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to list deal mappings." },
      { status: 500 },
    );
  }

  return Response.json({ form, mappings: result.data });
}
