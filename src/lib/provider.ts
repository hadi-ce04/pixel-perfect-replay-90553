import { RECORDS } from "@/data/records";
import { searchRecords } from "./search";
import type { SearchFilters, SearchResult, VideoRecord } from "./types";

/**
 * Data access boundary. A future live provider (e.g. an Oriane adapter)
 * implements this same interface; the UI does not change.
 */
export interface SearchProvider {
  readonly mode: "mock" | "live";
  search(query: string, filters: SearchFilters): Promise<SearchResult[]>;
  getById(id: string): Promise<VideoRecord | null>;
  getMany(ids: string[]): Promise<VideoRecord[]>;
  all(): Promise<VideoRecord[]>;
}

export class MockProvider implements SearchProvider {
  readonly mode = "mock" as const;
  constructor(private records: VideoRecord[] = RECORDS) {}
  async search(query: string, filters: SearchFilters) {
    return searchRecords(this.records, query, filters);
  }
  async getById(id: string) {
    return this.records.find((r) => r.id === id) ?? null;
  }
  async getMany(ids: string[]) {
    return ids
      .map((id) => this.records.find((r) => r.id === id))
      .filter((r): r is VideoRecord => !!r);
  }
  async all() {
    return this.records;
  }
}

export const provider: SearchProvider = new MockProvider();
