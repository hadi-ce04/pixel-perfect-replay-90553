import { OrianeProvider, type OrianeSearchInfo } from "./oriane-provider";
import { useQuery } from "@tanstack/react-query";
import { providerIdentity, useSearchProvider } from "./provider-context";
import { useStore } from "./store";
import { analyzeEvidence, type EvidenceAnalysis } from "./analysis";
import type { SearchResult } from "./types";

const EMPTY_RESULTS: SearchResult[] = [];
const EMPTY_ANALYSIS = analyzeEvidence("", []);

export function useResults() {
  const { query, filters, hydrated } = useStore();
  const source = useSearchProvider();
  const result = useQuery({
    queryKey: ["search", providerIdentity(source), query, filters],
    queryFn: async (): Promise<{
      results: SearchResult[];
      info: OrianeSearchInfo | null;
      analysis: EvidenceAnalysis;
    }> => {
      const { results, info } =
        source instanceof OrianeProvider
          ? await source.searchWithInfo(query, filters)
          : { results: await source.search(query, filters), info: null };
      // Query-specific analysis is cached with its own results, never shared across searches.
      return {
        results,
        info,
        analysis: analyzeEvidence(
          query,
          results.map((r) => r.record),
        ),
      };
    },
    staleTime: 60000,
    enabled: hydrated,
    retry: false,
  });
  return {
    results: result.data?.results ?? EMPTY_RESULTS,
    info: result.data?.info ?? null,
    analysis: result.data?.analysis ?? EMPTY_ANALYSIS,
    status: result.isPending
      ? ("loading" as const)
      : result.isError
        ? ("error" as const)
        : ("ready" as const),
    error: result.error?.message ?? null,
    retry: () => {
      void result.refetch();
    },
  };
}
