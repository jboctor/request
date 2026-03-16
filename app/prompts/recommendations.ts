export interface Recommendation {
  type: "Book" | "Audio Book" | "Movie" | "TV Show";
  title: string;
  author?: string;
  year?: string;
  reason: string;
}

export interface RecommendationSection {
  label: string;
  items: Recommendation[];
}

export const RECOMMENDATION_SYSTEM_PROMPT = `You are a media recommendation assistant. You return recommendations as a JSON array and nothing else. No markdown, no commentary, no code fences.

Each element must match this schema:
{
  "type": "Book" | "Audio Book" | "Movie" | "TV Show",
  "title": string,
  "author": string (for books/audio books only),
  "year": string (for movies/TV shows only),
  "reason": string (one short sentence explaining why)
}

Return between 3 and 6 recommendations. Mix different types. Only return the JSON array.`;

export function buildUserPrompt(mediaList: string, hasHistory: boolean): string {
  if (hasHistory) {
    return `Here is my media request history:\n\n${mediaList}\nBased on these, recommend similar things I might enjoy.`;
  }
  return "I haven't requested any media yet. Recommend some popular books, movies, and TV shows to get me started.";
}
