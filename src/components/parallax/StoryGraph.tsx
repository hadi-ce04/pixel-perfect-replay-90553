import { Background, Controls, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import { buildStoryGraph, type GraphNodeKind } from "@/lib/graph";
import type { VideoRecord } from "@/lib/types";

type Data = { label: string; kind: GraphNodeKind; count?: number; selected: boolean; saved: boolean; dim: boolean; idx: number };

const styles: Record<GraphNodeKind, string> = {
  question: "border-foreground bg-foreground text-background max-w-[230px] font-display text-lg leading-tight px-4 py-3",
  theme: "border-primary/70 bg-card text-foreground px-3 py-2 text-sm font-medium",
  perspective: "border-insight/70 bg-card text-foreground px-3 py-2 text-sm rounded-full",
  video: "border-border bg-background text-muted-foreground px-2.5 py-1.5 text-xs max-w-[240px]",
};

function StoryNodeView({ data }: NodeProps<Node<Data>>) {
  return (
    <div
      className={`fade-up border transition-all ${styles[data.kind]} ${data.selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""} ${data.dim ? "opacity-35" : ""}`}
      style={{ animationDelay: `${Math.min(data.idx * 18, 700)}ms` }}
    >
      <Handle type="target" position={Position.Left} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <div className="flex items-center gap-2">
        {data.kind === "video" && data.saved && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-label="saved" />}
        <span className="line-clamp-2">{data.label}</span>
        {data.count !== undefined && <span className="font-mono text-[11px] text-muted-foreground">{data.count}</span>}
      </div>
      <Handle type="source" position={Position.Right} className="!h-1 !w-1 !border-0 !bg-transparent" />
    </div>
  );
}

const nodeTypes = { story: StoryNodeView };

export function StoryGraph({
  question,
  records,
  selectedId,
  savedIds,
  onSelect,
  interactive = true,
}: {
  question: string;
  records: VideoRecord[];
  selectedId: string | null;
  savedIds: string[];
  onSelect?: (nodeId: string, kind: GraphNodeKind, refId: string) => void;
  interactive?: boolean;
}) {
  const g = useMemo(() => buildStoryGraph(question, records), [question, records]);

  const connected = useMemo(() => {
    if (!selectedId) return null;
    const s = new Set<string>([selectedId]);
    g.edges.forEach((e) => {
      if (e.source === selectedId) s.add(e.target);
      if (e.target === selectedId) s.add(e.source);
    });
    return s;
  }, [selectedId, g.edges]);

  const { nodes, edges } = useMemo(() => {
    const cols: Record<GraphNodeKind, number> = { question: 0, theme: 340, video: 680, perspective: 1080 };
    const byKind: Record<GraphNodeKind, typeof g.nodes> = { question: [], theme: [], video: [], perspective: [] };
    g.nodes.forEach((n) => byKind[n.kind].push(n));
    // order videos by their first theme for tidier edges
    const themeOrder = byKind.theme.map((t) => t.refId);
    byKind.video.sort((a, b) => {
      const ra = records.find((r) => r.id === a.refId)!;
      const rb = records.find((r) => r.id === b.refId)!;
      return themeOrder.indexOf(ra.themes[0]) - themeOrder.indexOf(rb.themes[0]);
    });
    const gap: Record<GraphNodeKind, number> = { question: 0, theme: 80, video: 52, perspective: 90 };
    const maxH = Math.max(...(Object.keys(byKind) as GraphNodeKind[]).map((k) => byKind[k].length * gap[k]));
    let idx = 0;
    const nodes: Node<Data>[] = [];
    (Object.keys(byKind) as GraphNodeKind[]).forEach((k) => {
      const list = byKind[k];
      const h = list.length * gap[k];
      list.forEach((n, i) => {
        nodes.push({
          id: n.id,
          type: "story",
          position: { x: cols[k], y: (maxH - h) / 2 + i * gap[k] },
          data: {
            label: n.label,
            kind: n.kind,
            count: n.count,
            selected: n.id === selectedId,
            saved: n.kind === "video" && savedIds.includes(n.refId),
            dim: !!connected && !connected.has(n.id),
            idx: idx++,
          },
          ariaLabel: `${n.kind}: ${n.label}`,
        });
      });
    });
    const edges: Edge[] = g.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      className: connected && (e.source === selectedId || e.target === selectedId) ? "is-active" : "",
    }));
    return { nodes, edges };
  }, [g, records, selectedId, savedIds, connected]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.12 }}
      minZoom={0.2}
      maxZoom={2}
      nodesDraggable={false}
      nodesConnectable={false}
      panOnDrag={interactive}
      zoomOnScroll={interactive}
      zoomOnPinch={interactive}
      zoomOnDoubleClick={interactive}
      elementsSelectable={interactive}
      onNodeClick={(_, n) => {
        const src = g.nodes.find((x) => x.id === n.id);
        if (src && onSelect) onSelect(src.id, src.kind, src.refId);
      }}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={48} color="oklch(1 0 0 / 5%)" />
      {interactive && <Controls showInteractive={false} position="bottom-right" />}
    </ReactFlow>
  );
}
