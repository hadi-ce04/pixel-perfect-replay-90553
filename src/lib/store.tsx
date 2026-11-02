import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { emptyFilters, type SearchFilters } from "./types";

interface Recent {
  query: string;
  at: string;
}

interface Store {
  query: string;
  setQuery: (q: string) => void;
  filters: SearchFilters;
  setFilters: (f: SearchFilters) => void;
  runSearch: (q: string) => void;
  saved: string[];
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  removeSaved: (id: string) => void;
  clearSaved: () => void;
  recent: Recent[];
  openId: string | null;
  openRecord: (id: string) => void;
  closeRecord: () => void;
  hydrated: boolean;
}

const Ctx = createContext<Store | null>(null);
const KEY = "parallax:v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("What are French students saying about housing affordability?");
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [saved, setSaved] = useState<string[]>([]);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.query === "string") setQuery(d.query);
        if (d.filters) setFilters({ ...emptyFilters, ...d.filters });
        if (Array.isArray(d.saved)) setSaved(d.saved);
        if (Array.isArray(d.recent)) setRecent(d.recent);
      }
    } catch {
      /* ignore corrupt storage */
    }
    loaded.current = true;
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ query, filters, saved, recent }));
    } catch {
      /* storage unavailable */
    }
  }, [query, filters, saved, recent]);

  const runSearch = useCallback((q: string) => {
    const t = q.trim();
    setQuery(t);
    if (t) setRecent((r) => [{ query: t, at: new Date().toISOString() }, ...r.filter((x) => x.query !== t)].slice(0, 6));
  }, []);

  const value = useMemo<Store>(
    () => ({
      query,
      setQuery,
      filters,
      setFilters,
      runSearch,
      saved,
      isSaved: (id) => saved.includes(id),
      toggleSaved: (id) => setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
      removeSaved: (id) => setSaved((s) => s.filter((x) => x !== id)),
      clearSaved: () => setSaved([]),
      recent,
      openId,
      openRecord: setOpenId,
      closeRecord: () => setOpenId(null),
      hydrated,
    }),
    [query, filters, runSearch, saved, recent, openId, hydrated],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside StoreProvider");
  return c;
}
