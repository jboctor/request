import type { Route } from "./+types/api.recommendations";
import { RequestService } from "~/services/requestService";
import { RecommendationService } from "~/services/recommendationService";
import type { Recommendation, RecommendationSection } from "~/prompts/recommendations";

const SECTION_CONFIG: { label: string; types: Recommendation["type"][] }[] = [
  { label: "Books", types: ["Book", "Audio Book"] },
  { label: "Movies", types: ["Movie"] },
  { label: "TV Shows", types: ["TV Show"] },
];

export async function loader({ context }: Route.LoaderArgs) {
  const user = context.session?.user;
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requests = await RequestService.getUserRequests(user.id);
    const activeRequests = requests.filter((r) => !r.dateDeleted);

    // Count requests per section (books + audiobooks combined)
    const sectionCounts = new Map<string, number>();
    for (const cfg of SECTION_CONFIG) {
      const count = activeRequests.filter((r) => cfg.types.includes(r.mediaType as Recommendation["type"])).length;
      sectionCounts.set(cfg.label, count);
    }

    const recommendations = await RecommendationService.getRecommendations(
      activeRequests.map((r) => ({ title: r.title, mediaType: r.mediaType }))
    );

    // Group recommendations into sections, sorted by user's genre request count descending
    const sections: RecommendationSection[] = SECTION_CONFIG
      .sort((a, b) => (sectionCounts.get(b.label) ?? 0) - (sectionCounts.get(a.label) ?? 0))
      .map((cfg) => ({
        label: cfg.label,
        items: recommendations.filter((r) => cfg.types.includes(r.type)),
      }))
      .filter((s) => s.items.length > 0);

    return Response.json({ sections });
  } catch (error) {
    console.error("Recommendation error:", error);
    return Response.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}
