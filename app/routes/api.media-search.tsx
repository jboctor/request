import type { Route } from "./+types/api.media-search";
import { getMediaSearchProvider } from "~/services/mediaSearch";

export async function loader({ request, context }: Route.LoaderArgs) {
  const user = context.session?.user;
  if (!user?.id) {
    return Response.json({ results: [] }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const mediaType = url.searchParams.get("type");

  if (!query || !mediaType || query.length < 2) {
    return Response.json({ results: [] });
  }

  const provider = getMediaSearchProvider(mediaType);
  if (!provider) {
    return Response.json({ results: [] });
  }

  try {
    const results = await provider.search(query);
    return Response.json({ results });
  } catch {
    return Response.json({ results: [] });
  }
}