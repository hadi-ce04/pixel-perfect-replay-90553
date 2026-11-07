import type { EvidenceEntry, Platform, SearchFilters, VideoRecord } from "./types";
import { planQuery, searchableFacets, type QueryFacet, type QueryPlan } from "./query-plan";

interface Obj {
  id?: any;
  platform?: any;
  title?: any;
  caption?: any;
  media?: any;
  transcriptChunks?: any;
  transcript?: any;
  frames?: any;
  onScreenText?: any;
  url?: any;
  sourceUrl?: any;
  platformId?: any;
  profileHandle?: any;
  thumbnailMediaUrl?: any;
  publishedAt?: any;
  profileDisplayName?: any;
  type?: any;
  duration?: any;
  hashtags?: any;
}
const TEXT_FIELDS = ["transcript", "onScreenText", "caption"] as const;
export const SEARCH_LIMIT = 25;
const DEFAULT_PLATFORMS: Platform[] = ["TikTok", "Instagram"];

/** Oriane query-group name for a facet; maps `matchedQueries` back to the plan. */
export const facetQueryName = (plan: QueryPlan, facet: QueryFacet) => `f${plan.facets.indexOf(facet)}`;

function facetGroup(plan: QueryPlan, facet: QueryFacet) {
  const values = facet.terms.slice(0, 10);
  const filters: Record<string, unknown> = {};
  for (const field of TEXT_FIELDS) filters[field] = { includesExactly: { values, operator: "or" } };
  if (facet.kind === "handle") filters["profileHandle"] = { includesExactly: { values, operator: "or" } };
  return { name: facetQueryName(plan, facet), operator: "or", filters };
}

function baseFilters(filters: SearchFilters, plan: QueryPlan) {
  const platforms = filters.platforms.length
    ? filters.platforms
    : plan.platforms.length
      ? plan.platforms
      : DEFAULT_PLATFORMS;
  return {
    format: { includes: ["video"] },
    platform: { includes: platforms.map((p) => p.toLowerCase()) },
    ...(filters.from || filters.to
      ? {
          publishedAt: {
            ...(filters.from ? { after: filters.from } : {}),
            ...(filters.to ? { before: filters.to } : {}),
          },
        }
      : {}),
  };
}

/** A relaxed pass is only distinct from the strict pass when there are two or more topic facets. */
export function hasBroadPass(plan: QueryPlan) {
  return searchableFacets(plan).filter((f) => f.role === "topic").length >= 2;
}

/**
 * Strict: every searchable facet must match. Broad: every anchor (name/phrase/hashtag) must
 * match, plus at least one topic word. Each facet is a named group so Oriane reports which
 * facets each result matched.
 */
export function planSearchBody(plan: QueryPlan, filters: SearchFilters, pass: "strict" | "broad") {
  const facets = searchableFacets(plan);
  if (!facets.length)
    throw new Error(
      "Parallax could not find a subject to search in this question. Add a name, place, topic word or a \"quoted phrase\".",
    );
  const anchors = facets.filter((f) => f.role === "anchor");
  const topics = facets.filter((f) => f.role === "topic");
  const queries =
    pass === "strict" || topics.length < 2
      ? facets.map((f) => facetGroup(plan, f))
      : [
          ...anchors.map((f) => facetGroup(plan, f)),
          { operator: "or", queries: topics.map((f) => facetGroup(plan, f)) },
        ];
  return { operator: "and", filters: baseFilters(filters, plan), queries };
}

export function contentSearchBody(
  query: string,
  filters: SearchFilters,
  ids?: string[],
  pass: "strict" | "broad" = "strict",
) {
  if (ids) return { operator: "and", filters: { id: { includes: ids } } };
  return planSearchBody(planQuery(query), filters, pass);
}

/** Map Oriane `matchedQueries` names (f0, f1…) back to facet keys. */
export function matchedFacetKeys(plan: QueryPlan, matchedQueries: unknown): string[] {
  if (!Array.isArray(matchedQueries)) return [];
  const keys: string[] = [];
  for (const name of matchedQueries) {
    const m = typeof name === "string" ? /^f(\d+)$/.exec(name) : null;
    const facet = m ? plan.facets[Number(m[1])] : undefined;
    if (facet && !keys.includes(facet.key)) keys.push(facet.key);
  }
  return keys;
}
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function https(value: unknown): string | null {
  try {
    const url = new URL(text(value));
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
// `_query` is accepted for call-site compatibility; source mapping never depends on the question.
export function normalizeOrianeRecord(raw: Obj, _query?: string): VideoRecord | null {
  const platforms: Record<string, VideoRecord["platform"]> = {
    tiktok: "TikTok",
    instagram: "Instagram",
    youtube: "YouTube",
  };
  if (!raw || typeof raw !== "object") return null;
  const platform = platforms[raw.platform];
  if (!platform || typeof raw.id !== "string") return null;
  const evidence: EvidenceEntry[] = [];
  const media = Array.isArray(raw.media) ? raw.media : [];
  media.forEach((item: Obj, mediaIndex: number) => {
    if (!item || typeof item !== "object") return;
    for (const chunk of Array.isArray(item.transcriptChunks) ? item.transcriptChunks : []) {
      if (
        chunk &&
        typeof chunk.text === "string" &&
        chunk.text.trim() &&
        Number.isFinite(chunk.startSeconds) &&
        chunk.startSeconds >= 0 &&
        Number.isFinite(chunk.endSeconds) &&
        chunk.endSeconds >= chunk.startSeconds
      )
        evidence.push({
          modality: "speech",
          excerpt: chunk.text,
          startSeconds: chunk.startSeconds,
          endSeconds: chunk.endSeconds,
          mediaIndex,
        });
    }
    if (!item.transcriptChunks?.length && text(item.transcript).trim())
      evidence.push({
        modality: "speech",
        excerpt: item.transcript,
        startSeconds: null,
        endSeconds: null,
        mediaIndex,
      });
    for (const frame of Array.isArray(item.frames) ? item.frames : [])
      for (const region of Array.isArray(frame?.onScreenTextRegions)
        ? frame.onScreenTextRegions
        : []) {
        if (region && text(region.text).trim())
          evidence.push({
            modality: "on-screen text",
            excerpt: region.text,
            startSeconds: Number.isFinite(frame.timestampSeconds) ? frame.timestampSeconds : null,
            endSeconds: null,
            mediaIndex,
          });
      }
    if (!item.frames?.length)
      for (const line of Array.isArray(item.onScreenText) ? item.onScreenText : [])
        if (text(line).trim())
          evidence.push({
            modality: "on-screen text",
            excerpt: line,
            startSeconds: null,
            endSeconds: null,
            mediaIndex,
          });
  });
  // Keep source order stable so saved passage indices still resolve after refresh.
  let sourceUrl = https(raw.url ?? raw.sourceUrl);
  if (!sourceUrl && platform === "YouTube" && /^[\w-]{11}$/.test(text(raw.platformId)))
    sourceUrl = `https://www.youtube.com/watch?v=${raw.platformId}`;
  if (
    !sourceUrl &&
    platform === "TikTok" &&
    /^\d+$/.test(text(raw.platformId)) &&
    /^[\w.]+$/.test(text(raw.profileHandle))
  )
    sourceUrl = `https://www.tiktok.com/@${raw.profileHandle}/video/${raw.platformId}`;
  const duration = media.find((m: Obj) => m?.type === "video")?.duration;
  return {
    id: raw.id,
    platform,
    sourceUrl,
    thumbnailUrl: https(raw.thumbnailMediaUrl),
    title: text(raw.title) || text(raw.caption).slice(0, 140) || "Untitled source video",
    description: text(raw.caption),
    publishedAt: text(raw.publishedAt),
    creatorLabel: text(raw.profileDisplayName) || text(raw.profileHandle) || "Creator not supplied",
    durationSeconds: Number.isFinite(duration) ? duration : null,
    contentType: "Unclassified",
    topic: "unclassified",
    evidence,
    // Themes are derived later from the returned passages (src/lib/analysis.ts), never stored here.
    themes: [],
    perspective: "unclassified",
    dataMode: "live",
    annotationMethod: "evidence-terms",
    sourceMediaCount: media.length,
    hashtags: Array.isArray(raw.hashtags)
      ? raw.hashtags.filter((h: unknown): h is string => typeof h === "string" && !!h.trim()).slice(0, 30)
      : [],
  };
}
