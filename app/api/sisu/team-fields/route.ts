import { loadSisuTeamFieldCatalog } from "@/app/api/_services/sisuTeamFieldsService";

export async function loader() {
  const result = await loadSisuTeamFieldCatalog();
  if (result.error || !result.data) {
    return Response.json(
      { message: result.error ?? "Failed to load SISU team fields." },
      { status: 502 },
    );
  }

  return Response.json({ fields: result.data });
}
