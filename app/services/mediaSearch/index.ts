export type { MediaSearchResult, MediaSearchProvider } from "./types";
import type { MediaSearchProvider } from "./types";
import { TmdbProvider } from "./tmdbProvider";
import { OpenLibraryProvider } from "./openLibraryProvider";

const movieProvider = new TmdbProvider("movie");
const tvProvider = new TmdbProvider("tv");
const bookProvider = new OpenLibraryProvider();

export function getMediaSearchProvider(mediaType: string): MediaSearchProvider | null {
  switch (mediaType) {
    case "Movie":
      return movieProvider;
    case "TV Show":
      return tvProvider;
    case "Book":
    case "Audio Book":
      return bookProvider;
    default:
      return null;
  }
}
