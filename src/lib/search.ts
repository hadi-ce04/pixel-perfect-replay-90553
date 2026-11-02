import { perspectiveOf, themeOf } from "@/data/catalog";
import type { SearchFilters, SearchResult, TopicId, VideoRecord } from "./types";

const STOPWORDS = new Set(
  "a an the of to in on for and or is are was were be what how who why do does are about saying say says talk talking people young french students student is it its their they with from by at as that this these those i my me we our you your".split(" "),
);

/** Topic alias map: natural-language words that imply a topic. */
export const TOPIC_ALIASES: Record<TopicId, string[]> = {
  housing: ["housing", "rent", "rents", "renting", "apartment", "flat", "studio", "landlord", "landlords", "accommodation", "residence", "crous", "guarantor", "colocation", "affordability", "lodging", "home"],
  groceries: ["grocery", "groceries", "food", "supermarket", "inflation", "prices", "price", "meal", "meals", "pantry", "shopping", "basket"],
  transport: ["transport", "transit", "bus", "train", "trains", "metro", "tram", "commute", "commuting", "fare", "fares", "strike", "bike", "cycling", "mobility"],
  employment: ["employment", "job", "jobs", "work", "working", "internship", "internships", "career", "graduate", "graduates", "hiring", "recruiter", "unemployment", "salary"],
  climate: ["climate", "environment", "ecology", "eco", "green", "carbon", "footprint", "emissions", "sustainable", "sustainability", "warming", "vegetarian"],
};

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ");
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function stem(t: string) {
  return t.replace(/(ies|es|s)$/, "");
}

export function detectTopics(query: string): TopicId[] {
  const tokens = tokenize(query).map(stem);
  return (Object.keys(TOPIC_ALIASES) as TopicId[]).filter((topic) =>
    TOPIC_ALIASES[topic].some((a) => tokens.includes(stem(a))),
  );
}

function recordText(r: VideoRecord) {
  const theme = r.themes.map((t) => themeOf(t)?.label ?? t).join(" ");
  const persp = perspectiveOf(r.perspective)?.label ?? r.perspective;
  return normalize([r.title, r.description, theme, persp, r.contentType, ...r.evidence.map((e) => e.excerpt)].join(" "));
}

export function passesFilters(r: VideoRecord, f: SearchFilters): boolean {
  if (f.platforms.length && !f.platforms.includes(r.platform)) return false;
  if (f.topics.length && !f.topics.includes(r.topic)) return false;
  if (f.contentTypes.length && !f.contentTypes.includes(r.contentType)) return false;
  if (f.from && r.publishedAt < f.from) return false;
  if (f.to && r.publishedAt > f.to) return false;
  return true;
}

/**
 * Score records against a query. Empty query returns all filtered records.
 * Detected topics give a strong boost; keyword hits in text add weight.
 */
export function searchRecords(records: VideoRecord[], query: string, filters: SearchFilters): SearchResult[] {
  const tokens = tokenize(query).map(stem);
  const topics = detectTopics(query);
  const filtered = records.filter((r) => passesFilters(r, filters));

  if (tokens.length === 0) {
    return filtered
      .map((record) => ({ record, score: 0, matchedExcerpt: record.evidence[0] ?? null }))
      .sort((a, b) => b.record.publishedAt.localeCompare(a.record.publishedAt));
  }

  const results: SearchResult[] = [];
  for (const record of filtered) {
    const text = recordText(record);
    const words = new Set(text.split(/\s+/).map(stem));
    let score = 0;
    if (topics.includes(record.topic)) score += 10;
    for (const t of tokens) if (words.has(t)) score += 2;
    if (score === 0) continue;
    let best = record.evidence[0] ?? null;
    let bestHits = -1;
    for (const e of record.evidence) {
      const ew = new Set(normalize(e.excerpt).split(/\s+/).map(stem));
      const hits = tokens.filter((t) => ew.has(t)).length + (e.modality === "speech" ? 0.1 : 0);
      if (hits > bestHits) {
        bestHits = hits;
        best = e;
      }
    }
    results.push({ record, score, matchedExcerpt: best });
  }
  return results.sort((a, b) => b.score - a.score || b.record.publishedAt.localeCompare(a.record.publishedAt));
}
