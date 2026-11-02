import { perspectiveById, themeById } from "@/data/catalog";
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

/** Build relationships strictly from record fields: question→theme→video, video→perspective. */
export function buildStoryGraph(question: string, records: VideoRecord[]) {
  const nodes: StoryNode[] = [{ id: "q", kind: "question", label: question || "All demonstration records", refId: "q" }];
  const edges: StoryEdge[] = [];
  const themeCounts = new Map<string, number>();
  const perspCounts = new Map<string, number>();
  for (const r of records) {
    r.themes.forEach((t) => themeCounts.set(t, (themeCounts.get(t) ?? 0) + 1));
    perspCounts.set(r.perspective, (perspCounts.get(r.perspective) ?? 0) + 1);
  }
  for (const [t, count] of themeCounts) {
    nodes.push({ id: `t:${t}`, kind: "theme", label: themeById[t]?.label ?? t, refId: t, count });
    edges.push({ id: `q-t:${t}`, source: "q", target: `t:${t}` });
  }
  for (const [p, count] of perspCounts) {
    nodes.push({ id: `p:${p}`, kind: "perspective", label: perspectiveById[p]?.label ?? p, refId: p, count });
  }
  for (const r of records) {
    nodes.push({ id: `v:${r.id}`, kind: "video", label: r.title, refId: r.id });
    r.themes.forEach((t) => edges.push({ id: `t:${t}-v:${r.id}`, source: `t:${t}`, target: `v:${r.id}` }));
    edges.push({ id: `v:${r.id}-p:${r.perspective}`, source: `v:${r.id}`, target: `p:${r.perspective}` });
  }
  return { nodes, edges, themeCounts, perspCounts };
}
