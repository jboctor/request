export interface MediaSearchResult {
  title: string;
  year: string | null;
  imageUrl: string | null;
}

export interface MediaSearchProvider {
  search(query: string): Promise<MediaSearchResult[]>;
}
