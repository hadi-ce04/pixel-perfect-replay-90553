import type { SearchProvider } from "./provider";
import type { EvidenceEntry, SearchFilters, SearchResult, VideoRecord } from "./types";
import { emptyFilters } from "./types";
import { searchableFacets, type QueryPlan } from "./query-plan";
import { fold, findTerm } from "./text";

export interface OrianeSearchInfo {
  partial: boolean;
  limited: boolean;
  totalCount: number;
  plan: QueryPlan;
  matching: { strictTotal: number; broadTotal: number | null; strictShown: number; broadShown: number };
  facetMatches: Record<string, string[]>;
}

/** Passage containing the most distinct question facets; speech wins ties, then source order. */
export function bestMatchingPassage(record: VideoRecord, plan: QueryPlan): EvidenceEntry | null {
  const facets = searchableFacets(plan);
  let best: EvidenceEntry | null = record.evidence[0] ?? null;
  let bestScore = -1;
  for (const e of record.evidence) {
    const folded = fold(e.excerpt);
    const hits = facets.filter((f) => findTerm(e.excerpt, f.terms, folded)).length;
    const score = hits + (e.modality === "speech" ? 0.1 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  return best;
}

export class OrianeProvider implements SearchProvider {
  readonly mode = "live" as const;
  private async request(
    operation: "search" | "getMany",
    query: string,
    filters: SearchFilters,
    ids?: string[],
  ) {
    const response = await fetch("/api/oriane", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation, query, filters, ...(ids ? { ids } : {}) }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Could not load Oriane data.");
    if (!Array.isArray(body.records)) throw new Error("Unexpected evidence response.");
    return body as { records: VideoRecord[] } & OrianeSearchInfo;
  }
  async searchWithInfo(
    query: string,
    filters: SearchFilters,
  ): Promise<{ results: SearchResult[]; info: OrianeSearchInfo }> {
    const body = await this.request("search", query, filters);
    const facetMatches = body.facetMatches ?? {};
    // Server order is kept: records matching every facet first, then relaxed matches.
    const results = body.records.map((record) => ({
      record,
      score: facetMatches[record.id]?.length ?? 0,
      matchedExcerpt: bestMatchingPassage(record, body.plan),
      matchedFacets: facetMatches[record.id] ?? [],
    }));
    return {
      results,
      info: {
        partial: body.partial,
        limited: body.limited,
        totalCount: body.totalCount,
        plan: body.plan,
        matching: body.matching,
        facetMatches,
      },
    };
  }
  async search(query: string, filters: SearchFilters) {
    return (await this.searchWithInfo(query, filters)).results;
  }
  async getMany(ids: string[]) {
    const sourceIds = [...new Set(ids.filter((id) => /^cnt_[a-zA-Z0-9]+$/.test(id)))];
    if (!sourceIds.length) return [];
    return (await this.request("getMany", "", emptyFilters, sourceIds)).records;
  }
  async getById(id: string) {
    return (await this.getMany([id]))[0] ?? null;
  }
  async all(): Promise<VideoRecord[]> {
    throw new Error("Live dataset enumeration is unavailable. Start with a research question.");
  }
}
