/**
 * Evidence-grounded themes. Every theme is derived from text that is present in the returned
 * source records (or, for fictional demo records only, from the isolated demo catalog) and
 * carries exact passage references. Labels are terms found in sources, never inferred claims.
 */
import { themeOf } from "@/data/catalog";
import { planQuery, searchableFacets, type QueryPlan } from "./query-plan";
import { LEGACY_KEYWORD_THEMES } from "./legacy-themes";
import { STOPWORDS, fold, findTerm, foldKey, slug, tokens } from "./text";
import type { VideoRecord } from "./types";

export type ThemeKind = "question-term" | "recurring-phrase" | "hashtag" | "catalog" | "legacy-keyword";

export interface ThemeDefinition {
  id: string;
  kind: ThemeKind;
  label: string;
  terms: string[];
}

export interface PassageRef {
  recordId: string;
  field: "evidence" | "caption" | "title" | "hashtags" | "record";
  evidenceIndex: number | null;
  excerpt: string;
  modality: string;
  startSeconds: number | null;
  endSeconds: number | null;
  match: { start: number; end: number } | null;
}

export interface EvidenceTheme extends ThemeDefinition {
  description: string;
  recordIds: string[];
  supports: PassageRef[];
}

export interface EvidenceAnalysis {
  question: string;
  plan: QueryPlan;
  themes: EvidenceTheme[];
  byId: Record<string, EvidenceTheme>;
  recordThemes: Record<string, string[]>;
  unmatchedFacets: string[];
  method: "evidence-terms" | "catalog" | "mixed" | "none";
}

const foldCache = new WeakMap<VideoRecord, string[]>();
function foldedEvidence(record: VideoRecord) {
  let cached = foldCache.get(record);
  if (!cached) {
    cached = record.evidence.map((e) => fold(e.excerpt));
    foldCache.set(record, cached);
  }
  return cached;
}

/** Exact passages in one record that support a theme definition. Re-applicable after reload. */
export function themeSupports(def: ThemeDefinition, record: VideoRecord): PassageRef[] {
  const base = { recordId: record.id };
  if (def.kind === "catalog") {
    return record.dataMode === "mock" && record.themes.includes(def.id)
      ? [
          {
            ...base,
            field: "record",
            evidenceIndex: null,
            excerpt: "",
            modality: "record",
            startSeconds: null,
            endSeconds: null,
            match: null,
          },
        ]
      : [];
  }
  if (def.kind === "hashtag") {
    const tag = (record.hashtags ?? []).find((h) => foldKey(h) === foldKey(def.label));
    return tag
      ? [
          {
            ...base,
            field: "hashtags",
            evidenceIndex: null,
            excerpt: tag,
            modality: "hashtag",
            startSeconds: null,
            endSeconds: null,
            match: null,
          },
        ]
      : [];
  }
  if (!def.terms.length) return [];
  const refs: PassageRef[] = [];
  const folded = foldedEvidence(record);
  record.evidence.forEach((e, i) => {
    const m = findTerm(e.excerpt, def.terms, folded[i]);
    if (m)
      refs.push({
        ...base,
        field: "evidence",
        evidenceIndex: i,
        excerpt: e.excerpt,
        modality: e.modality,
        startSeconds: e.startSeconds,
        endSeconds: e.endSeconds,
        match: { start: m.start, end: m.end },
      });
  });
  const extra: [PassageRef["field"], string][] = [["caption", record.description]];
  if (record.title && !record.description.startsWith(record.title)) extra.push(["title", record.title]);
  for (const [field, text] of extra) {
    const m = text ? findTerm(text, def.terms) : null;
    if (m)
      refs.push({
        ...base,
        field,
        evidenceIndex: null,
        excerpt: text,
        modality: field,
        startSeconds: null,
        endSeconds: null,
        match: { start: m.start, end: m.end },
      });
  }
  return refs;
}

function describe(def: ThemeDefinition, recordCount: number, passageCount: number): string {
  switch (def.kind) {
    case "catalog":
      return themeOf(def.id).description;
    case "question-term":
      return `Passages containing “${def.label}” from your question (${passageCount} passages in ${recordCount} records). A text match, not a verified claim or stance.`;
    case "recurring-phrase":
      return `“${def.label}” recurs in ${recordCount} records (${passageCount} passages). A shared phrase, not a shared claim.`;
    case "hashtag":
      return `Creators tagged ${def.label} on ${recordCount} records. Hashtags describe the post, not what the speaker says.`;
    case "legacy-keyword":
      return `Keyword tag saved before evidence-derived themes. Matches: ${def.terms.join(", ")}. Review the source context.`;
  }
}

export function resolveTheme(def: ThemeDefinition, records: VideoRecord[]): EvidenceTheme {
  const supports: PassageRef[] = [];
  const recordIds: string[] = [];
  for (const r of uniqueSorted(records)) {
    const s = themeSupports(def, r);
    if (s.length) {
      recordIds.push(r.id);
      supports.push(...s);
    }
  }
  return {
    ...def,
    description: describe(def, recordIds.length, supports.length),
    recordIds,
    supports,
  };
}

function uniqueSorted(records: VideoRecord[]) {
  return [...new Map(records.map((r) => [r.id, r])).values()].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
}

export function legacyThemeDefinition(id: string): ThemeDefinition | null {
  const terms = LEGACY_KEYWORD_THEMES[id];
  if (!terms) return null;
  return { id, kind: "legacy-keyword", label: `Keyword tag “${themeOf(id).label}”`, terms: [...terms] };
}

export function catalogThemeDefinition(id: string): ThemeDefinition {
  return { id, kind: "catalog", label: themeOf(id).label, terms: [] };
}

const isStop = (t: string) => STOPWORDS.has(t) || t.length < 2 || /^\d+$/.test(t) || t.length > 30;

interface Gram {
  records: Set<string>;
  passages: number;
  surfaces: Map<string, number>;
  n: number;
}

function minePhrases(records: VideoRecord[], excluded: Set<string>, facetTokens: Set<string>, max: number) {
  const stats = new Map<string, Gram>();
  for (const r of records) {
    const units = [...r.evidence.map((e) => e.excerpt), r.description];
    for (const text of units) {
      if (!text) continue;
      const toks = tokens(text);
      const seenHere = new Set<string>();
      for (let i = 0; i < toks.length; i++) {
        for (let n = 1; n <= 3 && i + n <= toks.length; n++) {
          const gram = toks.slice(i, i + n);
          const first = gram[0]!.folded,
            last = gram[n - 1]!.folded;
          if (isStop(first) || isStop(last)) continue;
          if (n === 1 && first.length < 4) continue;
          if (gram.some((t) => t.folded.length > 30)) continue;
          const key = gram.map((t) => t.folded).join(" ");
          if (excluded.has(key)) continue;
          if (gram.every((t) => facetTokens.has(t.folded) || STOPWORDS.has(t.folded))) continue;
          let st = stats.get(key);
          if (!st) {
            st = { records: new Set(), passages: 0, surfaces: new Map(), n };
            stats.set(key, st);
          }
          if (!seenHere.has(key)) {
            st.passages++;
            seenHere.add(key);
          }
          st.records.add(r.id);
          const surface = text.slice(gram[0]!.start, gram[n - 1]!.start + gram[n - 1]!.surface.length);
          if (st.surfaces.size < 6 || st.surfaces.has(surface))
            st.surfaces.set(surface, (st.surfaces.get(surface) ?? 0) + 1);
        }
      }
    }
  }
  const weight = [0, 1, 1.5, 1.8];
  const candidates = [...stats]
    .filter(([, s]) => s.records.size >= 2)
    .map(([key, s]) => ({
      key,
      s,
      score: s.records.size * weight[s.n]! + Math.min(s.passages, 3 * s.records.size) * 0.1,
    }))
    .sort((a, b) => b.score - a.score || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const chosen: typeof candidates = [];
  const contains = (a: string, b: string) => ` ${a} `.includes(` ${b} `);
  for (const c of candidates) {
    if (chosen.length >= max) break;
    const dup = chosen.some((x) => {
      if (!contains(x.key, c.key) && !contains(c.key, x.key)) return false;
      let overlap = 0;
      for (const id of c.s.records) if (x.s.records.has(id)) overlap++;
      return overlap >= 0.6 * Math.min(c.s.records.size, x.s.records.size);
    });
    if (!dup) chosen.push(c);
  }
  return chosen.map(({ key, s }) => {
    const label = [...s.surfaces].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]![0];
    return { id: `phrase:${slug(key)}`, kind: "recurring-phrase" as const, label, terms: [key] };
  });
}

export function analyzeEvidence(
  question: string,
  records: VideoRecord[],
  opts: { extraThemes?: ThemeDefinition[]; maxPhrases?: number } = {},
): EvidenceAnalysis {
  const sorted = uniqueSorted(records);
  const plan = planQuery(question);
  const mock = sorted.filter((r) => r.dataMode === "mock");
  const live = sorted.filter((r) => r.dataMode === "live");
  const defs: ThemeDefinition[] = [];
  // Fictional catalog themes, isolated to demonstration records; keep first-appearance order.
  const catalogIds = [...new Set(records.filter((r) => r.dataMode === "mock").flatMap((r) => r.themes))];
  catalogIds.forEach((id) => defs.push(catalogThemeDefinition(id)));
  const unmatchedFacets: string[] = [];
  if (live.length) {
    const facets = searchableFacets(plan);
    for (const f of facets)
      defs.push({ id: `term:${slug(f.key)}`, kind: "question-term", label: f.label, terms: f.terms });
    const tagCounts = new Map<string, { label: string; records: Set<string> }>();
    for (const r of live)
      for (const h of r.hashtags ?? []) {
        const k = foldKey(h);
        if (!k) continue;
        const entry = tagCounts.get(k) ?? { label: h.startsWith("#") ? h : `#${h}`, records: new Set() };
        entry.records.add(r.id);
        tagCounts.set(k, entry);
      }
    [...tagCounts]
      .filter(([, v]) => v.records.size >= 2)
      .sort((a, b) => b[1].records.size - a[1].records.size || (a[0] < b[0] ? -1 : 1))
      .slice(0, 4)
      .forEach(([k, v]) => defs.push({ id: `tag:${slug(k)}`, kind: "hashtag", label: v.label, terms: [] }));
    const excluded = new Set(facets.flatMap((f) => f.terms.map(foldKey)));
    const facetTokens = new Set([...excluded].flatMap((k) => k.split(" ")));
    defs.push(...minePhrases(live, excluded, facetTokens, opts.maxPhrases ?? 8));
  }
  for (const extra of opts.extraThemes ?? []) if (!defs.some((d) => d.id === extra.id)) defs.push(extra);

  const themes: EvidenceTheme[] = [];
  for (const def of defs) {
    const scope = def.kind === "catalog" ? mock : def.kind === "legacy-keyword" ? sorted : live;
    const theme = resolveTheme(def, scope);
    if (theme.recordIds.length) themes.push(theme);
    else if (def.kind === "question-term") unmatchedFacets.push(foldKey(def.label));
  }
  const byId = Object.fromEntries(themes.map((t) => [t.id, t]));
  const recordThemes: Record<string, string[]> = {};
  for (const r of sorted) recordThemes[r.id] = [];
  for (const t of themes) for (const id of t.recordIds) recordThemes[id]!.push(t.id);
  return {
    question,
    plan,
    themes,
    byId,
    recordThemes,
    unmatchedFacets,
    method:
      mock.length && live.length ? "mixed" : live.length ? "evidence-terms" : mock.length ? "catalog" : "none",
  };
}

/** A minimal analysis containing a single resolved theme (used to validate saved leads). */
export function singleThemeAnalysis(question: string, theme: EvidenceTheme): EvidenceAnalysis {
  const recordThemes: Record<string, string[]> = {};
  for (const id of theme.recordIds) recordThemes[id] = [theme.id];
  return {
    question,
    plan: planQuery(question),
    themes: [theme],
    byId: { [theme.id]: theme },
    recordThemes,
    unmatchedFacets: [],
    method: "evidence-terms",
  };
}
