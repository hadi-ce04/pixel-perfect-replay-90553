import { useQuery } from "@tanstack/react-query";
import { providerIdentity, useSearchProvider } from "./provider-context";
import { useStore } from "./store";
import type { SearchResult } from "./types";

const EMPTY_RESULTS: SearchResult[] = [];

export function useResults() {
  const { query, filters, hydrated } = useStore();
  const source = useSearchProvider();
  const result = useQuery({
    queryKey: ["search", providerIdentity(source), query, filters],
    queryFn: () => source.search(query, filters),
    enabled: hydrated,
    retry: false,
  });
  return {
    results: result.data ?? EMPTY_RESULTS,
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
