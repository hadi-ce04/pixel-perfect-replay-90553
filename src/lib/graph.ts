import { perspectiveOf } from "@/data/catalog";
import { analyzeEvidence, type EvidenceAnalysis } from "./analysis";
import type { VideoRecord } from "./types";

export type GraphNodeKind = "question" | "theme" | "perspective" | "video";

export interface StoryNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  refId: string;
  count?: number;
}
export interface StoryEdge {
  id: string;
  source: string;
  target: string;
}

/**
 * Build relationships strictly from evidence analysis: question→theme→video, video→perspective.
 * Theme membership comes from passages that contain the theme term (or, for fictional demo
 * records, from the isolated demo catalog).
 */
export function buildStoryGraph(
  question: string,
  records: VideoRecord[],
  analysis: EvidenceAnalysis = analyzeEvidence(question, records),
) {
  const nodes: StoryNode[] = [
    { id: "q", kind: "question", label: question || "All demonstration records", refId: "q" },
  ];
  const edges: StoryEdge[] = [];
  const themeCounts = new Map<string, number>();
  const perspCounts = new Map<string, number>();
  const present = new Set(records.map((r) => r.id));
  for (const t of analysis.themes) {
    const count = t.recordIds.filter((id) => present.has(id)).length;
    if (count) themeCounts.set(t.id, count);
  }
  for (const r of records) perspCounts.set(r.perspective, (perspCounts.get(r.perspective) ?? 0) + 1);
  for (const [t, count] of themeCounts) {
    nodes.push({ id: `t:${t}`, kind: "theme", label: analysis.byId[t]?.label ?? t, refId: t, count });
    edges.push({ id: `q-t:${t}`, source: "q", target: `t:${t}` });
  }
  for (const [p, count] of perspCounts) {
    nodes.push({ id: `p:${p}`, kind: "perspective", label: perspectiveOf(p)?.label ?? p, refId: p, count });
  }
  const seen = new Set<string>();
  for (const r of records) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    nodes.push({ id: `v:${r.id}`, kind: "video", label: r.title, refId: r.id });
    (analysis.recordThemes[r.id] ?? [])
      .filter((t) => themeCounts.has(t))
      .forEach((t) => edges.push({ id: `t:${t}-v:${r.id}`, source: `t:${t}`, target: `v:${r.id}` }));
    edges.push({ id: `v:${r.id}-p:${r.perspective}`, source: `v:${r.id}`, target: `p:${r.perspective}` });
  }
  return { nodes, edges, themeCounts, perspCounts, analysis };
}
