import { loadFixture } from "@/app/api/_mock/loadFixture";
import { fetchLiveFubTags } from "@/app/api/_services/fubLiveClient";
import { isFubApiEnabled } from "@/app/api/_services/fubApiMode";

type TagsFixture = {
  tags: string[];
};

export async function loader() {
  if (isFubApiEnabled()) {
    const live = await fetchLiveFubTags();
    if (live.error || !live.data) {
      return Response.json(
        { message: live.error ?? "Failed to load FUB tags." },
        { status: live.status ?? 502 },
      );
    }

    return Response.json({ tags: live.data.tags });
  }

  const fixture = loadFixture<TagsFixture>("fub-tags.json");
  return Response.json({ tags: fixture.tags });
}
