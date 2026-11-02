import { perspectiveOf, themeOf, topicOf } from "@/data/catalog";
import { formatTime } from "./format";
import type { VideoRecord } from "./types";

export interface BriefReference {
  recordId: string;
  title: string;
  excerpt: string;
  modality: string;
  startSeconds: number;
  endSeconds: number;
}

export interface Brief {
  question: string;
  recordCount: number;
  platforms: Record<string, number>;
  topics: string[];
  dateRange: [string, string] | null;
  themes: { id: string; label: string; description: string; recordIds: string[] }[];
  perspectives: { id: string; label: string; recordIds: string[] }[];
  comparisonNote: string;
  excerpts: BriefReference[];
  verification: string[];
  angles: string[];
}

/** Deterministic brief derived only from the saved records. */
export function generateBrief(question: string, records: VideoRecord[]): Brief {
  const sorted = [...records].sort((a, b) => a.id.localeCompare(b.id));
  const platforms: Record<string, number> = {};
  const themeMap = new Map<string, string[]>();
  const perspMap = new Map<string, string[]>();
  for (const r of sorted) {
    platforms[r.platform] = (platforms[r.platform] ?? 0) + 1;
    r.themes.forEach((t) => themeMap.set(t, [...(themeMap.get(t) ?? []), r.id]));
    perspMap.set(r.perspective, [...(perspMap.get(r.perspective) ?? []), r.id]);
  }
  const dates = sorted.map((r) => r.publishedAt).sort();
  const themes = [...themeMap]
    .map(([id, recordIds]) => ({ id, label: themeOf(id)?.label ?? id, description: themeOf(id)?.description ?? "", recordIds }))
    .sort((a, b) => b.recordIds.length - a.recordIds.length || a.label.localeCompare(b.label));
  const perspectives = [...perspMap]
    .map(([id, recordIds]) => ({ id, label: perspectiveOf(id)?.label ?? id, recordIds }))
    .sort((a, b) => b.recordIds.length - a.recordIds.length || a.label.localeCompare(b.label));

  let comparisonNote: string;
  if (sorted.length < 2) comparisonNote = "Only one record is selected. Save more evidence to compare perspectives.";
  else if (perspectives.length < 2)
    comparisonNote = `All selected records share one perspective (${perspectives[0]?.label}). The selection cannot support a contrast between viewpoints.`;
  else comparisonNote = `The selection includes ${perspectives.length} distinct perspectives, listed below with their records.`;

  const excerpts: BriefReference[] = sorted.map((r) => {
    const e = r.evidence.find((x) => x.modality === "speech") ?? r.evidence[0];
    return { recordId: r.id, title: r.title, excerpt: e?.excerpt ?? "", modality: e?.modality ?? "speech", startSeconds: e?.startSeconds ?? 0, endSeconds: e?.endSeconds ?? 0 };
  });

  const verification: string[] = [];
  const numeric = sorted.filter((r) => r.evidence.some((e) => /\d/.test(e.excerpt)));
  if (numeric.length)
    verification.push(`Figures cited in ${numeric.map((r) => r.id).join(", ")} (prices, rents, counts) need checking against official or primary sources.`);
  verification.push("Confirm the identity and circumstances of each speaker; creator labels are descriptive and unverified.");
  if (sorted.some((r) => r.perspective === "advocate"))
    verification.push("Advocacy claims (e.g. demand increases, petition sizes) should be confirmed with the organisations and independent data.");
  if (sorted.some((r) => r.perspective === "skeptic"))
    verification.push("Contrarian arguments in the selection should be tested against available statistics before being framed as counterpoints.");
  verification.push("These records are fictional demonstration data; replace with real, verified sources before any publication.");

  const angles: string[] = [];
  if (themes[0] && themes[0].recordIds.length < 2) angles.push("No theme recurs across records yet; save more evidence before choosing a lead theme.");
  else if (themes[0]) angles.push(`Lead with "${themes[0].label}", the most recurrent theme in this selection (${themes[0].recordIds.length} of ${sorted.length} records).`);
  const [p0, p1] = perspectives;
  if (p0 && p1)
    angles.push(`Contrast ${p0.label.toLowerCase()} accounts with ${p1.label.toLowerCase()} viewpoints already present in the selection.`);
  const [t0, t1] = themes;
  if (t0 && t1) angles.push(`Explore how "${t0.label}" connects to "${t1.label}" in the same records.`);
  if (sorted.some((r) => r.evidence.some((e) => e.modality === "visual")))
    angles.push("Visual evidence in the selection could support a documentary or photo-led treatment.");

  return {
    question,
    recordCount: sorted.length,
    platforms,
    topics: [...new Set(sorted.map((r) => topicOf(r.topic).label))],
    dateRange: dates.length ? [dates[0]!, dates[dates.length - 1]!] : null,
    themes,
    perspectives,
    comparisonNote,
    excerpts,
    verification,
    angles,
  };
}

export function briefToMarkdown(b: Brief): string {
  const L: string[] = [];
  L.push("# PARALLAX — Demonstration editorial brief", "");
  L.push("> Based on fictional demonstration records. Not real sources. Not representative of public opinion.", "");
  L.push(`**Research question:** ${b.question || "—"}`, "");
  L.push("## Source coverage");
  L.push(`- Records included: ${b.recordCount}`);
  L.push(`- Platforms: ${Object.entries(b.platforms).map(([k, v]) => `${k} (${v})`).join(", ")}`);
  L.push(`- Topics: ${b.topics.join(", ")}`);
  if (b.dateRange) L.push(`- Published: ${b.dateRange[0]} to ${b.dateRange[1]}`);
  L.push("", "## Observed themes");
  b.themes.forEach((t) => L.push(`- **${t.label}** — ${t.description} (${t.recordIds.join(", ")})`));
  L.push("", "## Perspectives");
  L.push(b.comparisonNote);
  b.perspectives.forEach((p) => L.push(`- ${p.label}: ${p.recordIds.join(", ")}`));
  L.push("", "## Supporting excerpts");
  b.excerpts.forEach((e) => L.push(`- "${e.excerpt}" — ${e.recordId}, ${e.modality}, ${formatTime(e.startSeconds)}–${formatTime(e.endSeconds)}`));
  L.push("", "## Requires independent verification");
  b.verification.forEach((v) => L.push(`- ${v}`));
  L.push("", "## Potential editorial angles");
  b.angles.forEach((a) => L.push(`- ${a}`));
  return L.join("\n");
}
