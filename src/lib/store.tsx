import { isLiveMode } from "./provider";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { emptyFilters, type SearchFilters } from "./types";
import type { ReportingLead } from "./tensions";
import { legacyThemeDefinition, type ThemeDefinition } from "./analysis";

const THEME_KINDS = ["question-term", "recurring-phrase", "hashtag", "catalog", "legacy-keyword"];

function validThemeSnapshot(theme: unknown): theme is ThemeDefinition {
  const t = theme as ThemeDefinition | null;
  return (
    !!t &&
    typeof t === "object" &&
    typeof t.id === "string" &&
    typeof t.label === "string" &&
    THEME_KINDS.includes(t.kind) &&
    Array.isArray(t.terms) &&
    t.terms.every((term) => typeof term === "string")
  );
}

/**
 * Restore a stored reporting lead. Older live leads referenced a fixed keyword dictionary;
 * they are migrated to an explicit legacy keyword snapshot rather than discarded.
 */
export function restoreReportingLead(lead: any, live: boolean): ReportingLead | null {
  if (
    !lead ||
    typeof lead.themeId !== "string" ||
    typeof lead.question !== "string" ||
    typeof lead.researchQuestion !== "string" ||
    !Array.isArray(lead.recordIds) ||
    lead.recordIds.length !== 2 ||
    !lead.recordIds.every((id: unknown) => typeof id === "string") ||
    !Array.isArray(lead.excerptTexts) ||
    lead.excerptTexts.length !== 2 ||
    !lead.excerptTexts.every((text: unknown) => typeof text === "string") ||
    !Array.isArray(lead.evidenceIndices) ||
    lead.evidenceIndices.length !== 2 ||
    !lead.evidenceIndices.every(
      (index: unknown) => typeof index === "number" && Number.isInteger(index) && index >= 0,
    )
  )
    return null;
  const { theme, ...rest } = lead;
  if (theme !== undefined) return validThemeSnapshot(theme) ? { ...rest, theme } : null;
  if (live) {
    const legacy = legacyThemeDefinition(lead.themeId);
    return legacy ? { ...rest, theme: legacy } : rest;
  }
  return rest;
}

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
  reportingLead: ReportingLead | null;
  chooseReportingLead: (lead: ReportingLead) => void;
  recent: Recent[];
  openId: string | null;
  openRecord: (id: string) => void;
  closeRecord: () => void;
  hydrated: boolean;
}

const Ctx = createContext<Store | null>(null);
const KEY = isLiveMode ? "parallax:live:v1" : "parallax:v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState(
    "What are French students saying about housing affordability?",
  );
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [saved, setSaved] = useState<string[]>([]);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [reportingLead, setReportingLead] = useState<ReportingLead | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (typeof d.query === "string") setQuery(d.query);
        // Fixed topic filters apply only to the fictional examples; live search is open-topic.
        if (d.filters)
          setFilters({ ...emptyFilters, ...d.filters, ...(isLiveMode ? { topics: [] } : {}) });
        if (Array.isArray(d.saved)) setSaved(d.saved);
        if (Array.isArray(d.recent)) setRecent(d.recent);
        const lead = restoreReportingLead(d.reportingLead, isLiveMode);
        if (lead) setReportingLead(lead);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    // The initial render must not overwrite storage while hydration restores it.
    // A ref changes within the effect cycle and breaks StrictMode's effect replay.
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ query, filters, saved, recent, reportingLead }));
    } catch {
      /* storage unavailable */
    }
  }, [query, filters, saved, recent, hydrated, reportingLead]);

  const runSearch = useCallback((q: string) => {
    const t = q.trim();
    setQuery(t);
    if (t)
      setRecent((r) =>
        [{ query: t, at: new Date().toISOString() }, ...r.filter((x) => x.query !== t)].slice(0, 6),
      );
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
      toggleSaved: (id) => {
        if (saved.includes(id) && reportingLead?.recordIds.includes(id)) setReportingLead(null);
        setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
      },
      removeSaved: (id) => {
        setSaved((s) => s.filter((x) => x !== id));
        if (reportingLead?.recordIds.includes(id)) setReportingLead(null);
      },
      clearSaved: () => {
        setSaved([]);
        setReportingLead(null);
      },
      reportingLead,
      chooseReportingLead: (lead) => {
        setSaved((s) => [...new Set([...s, ...lead.recordIds])]);
        setReportingLead(lead);
      },
      recent,
      openId,
      openRecord: setOpenId,
      closeRecord: () => setOpenId(null),
      hydrated,
    }),
    [query, filters, runSearch, saved, recent, openId, hydrated, reportingLead],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside StoreProvider");
  return c;
}
