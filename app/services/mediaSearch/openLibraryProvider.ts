import type { MediaSearchProvider, MediaSearchResult } from "./types";

const OL_SEARCH_URL = "https://openlibrary.org/search.json";
const OL_COVER_BASE = "https://covers.openlibrary.org/b/id";

interface OpenLibraryDoc {
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

interface OpenLibraryResponse {
  docs: OpenLibraryDoc[];
}

export class OpenLibraryProvider implements MediaSearchProvider {
  async search(query: string): Promise<MediaSearchResult[]> {
    const url = new URL(OL_SEARCH_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "5");
    url.searchParams.set("fields", "title,author_name,first_publish_year,cover_i");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "RequestApp/1.0",
      },
    });

    if (!response.ok) return [];

    const data: OpenLibraryResponse = await response.json();

    return data.docs.map((doc) => {
      const author = doc.author_name?.[0];
      const title = author ? `${doc.title} - ${author}` : doc.title;
      const year = doc.first_publish_year ? String(doc.first_publish_year) : null;
      const imageUrl = doc.cover_i ? `${OL_COVER_BASE}/${doc.cover_i}-S.jpg` : null;

      return { title, year, imageUrl };
    });
  }
}
