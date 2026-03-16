import type { MediaSearchProvider, MediaSearchResult } from "./types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w92";

interface TmdbMovieResult {
  title: string;
  release_date?: string;
  poster_path?: string | null;
}

interface TmdbTvResult {
  name: string;
  first_air_date?: string;
  poster_path?: string | null;
}

interface TmdbSearchResponse {
  results: (TmdbMovieResult | TmdbTvResult)[];
}

export class TmdbProvider implements MediaSearchProvider {
  private endpoint: string;
  private apiKey: string;

  constructor(category: "movie" | "tv") {
    this.endpoint = `${TMDB_BASE_URL}/search/${category}`;
    this.apiKey = process.env.TMDB_API_KEY || "";
  }

  async search(query: string): Promise<MediaSearchResult[]> {
    if (!this.apiKey) return [];

    const url = new URL(this.endpoint);
    url.searchParams.set("query", query);
    url.searchParams.set("page", "1");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) return [];

    const data: TmdbSearchResponse = await response.json();

    return data.results.slice(0, 5).map((item) => {
      const isMovie = "title" in item;
      const title = isMovie ? (item as TmdbMovieResult).title : (item as TmdbTvResult).name;
      const date = isMovie
        ? (item as TmdbMovieResult).release_date
        : (item as TmdbTvResult).first_air_date;
      const year = date ? date.substring(0, 4) : null;
      const imageUrl = item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null;

      return { title, year, imageUrl };
    });
  }
}
