import { useEffect, useState } from "react";
import { provider } from "./provider";
import { useStore } from "./store";
import type { SearchResult } from "./types";

/** Runs the current query + filters through the SearchProvider. */
export function useResults() {
  const { query, filters } = useStore();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setStatus("loading");
    provider
      .search(query, filters)
      .then((r) => {
        if (!alive) return;
        setResults(r);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Search failed");
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, [query, filters]);
  return { results, status, error };
}
