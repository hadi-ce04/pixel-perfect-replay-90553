import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { perspectiveOf, themeOf } from "@/data/catalog";
import { SaveButton } from "@/components/parallax/SaveButton";
import { buildStoryGraph, type GraphNodeKind } from "@/lib/graph";
import { useStore } from "@/lib/store";
import { useResults } from "@/lib/useResults";
import { useHydrated } from "@/lib/useHydrated";

const StoryGraph = lazy(() => import("@/components/parallax/StoryGraph").then((m) => ({ default: m.StoryGraph })));

export const Route = createFileRoute("/app/story-dna")({
  head: () => ({
    meta: [
      { title: "Story DNA — PARALLAX workspace" },
      { name: "description", content: "See how themes, perspectives and video records connect in your investigation." },
      { property: "og:title", content: "Story DNA — PARALLAX workspace" },
      { property: "og:description", content: "See how themes, perspectives and video records connect in your investigation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoryDNA,
});

function StoryDNA() {
  const { query, saved, openRecord } = useStore();
  const { results, status } = useResults();
  const records = useMemo(() => results.map((r) => r.record), [results]);
  const [view, setView] = useState<"graph" | "list">("graph");
  const [sel, setSel] = useState<{ id: string; kind: GraphNodeKind; ref: string } | null>(null);
  const hydrated = useHydrated();
  const g = useMemo(() => buildStoryGraph(query, records), [query, records]);

  const onSelect = (id: string, kind: GraphNodeKind, ref: string) => {
    setSel({ id, kind, ref });
    if (kind === "video") openRecord(ref);
  };

  const panelRecords =
    sel?.kind === "theme" ? records.filter((r) => r.themes.includes(sel.ref)) : sel?.kind === "perspective" ? records.filter((r) => r.perspective === sel.ref) : [];

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border px-5 py-8 md:px-10">
        <p className="eyebrow">Workspace · Story DNA</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="max-w-3xl font-display text-3xl leading-tight md:text-5xl">{query || "All demonstration records"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {records.length} fictional records · {g.themeCounts.size} themes · {g.perspCounts.size} perspectives
            </p>
          </div>
          <div role="tablist" aria-label="View" className="flex border border-border">
            {(["graph", "list"] as const).map((v) => (
              <Button variant="editorial" key={v} role="tab" aria-selected={view === v} type="button" onClick={() => setView(v)} className={`px-4 py-1.5 text-xs capitalize ${view === v ? "bg-foreground text-background" : "text-muted-foreground"}`}>
                {v}
              </Button>
            ))}
          </div>
        </div>
        <ul className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Legend">
          <li className="flex items-center gap-2"><span className="h-3 w-3 border-2 border-foreground" />Research question</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 border border-foreground" />Theme (count = records)</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 border border-border bg-background" />Video record</li>
          <li className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border border-border" />Perspective</li>
          <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Saved</li>
        </ul>
      </div>

      {status === "ready" && records.length === 0 ? (
        <div className="p-10 text-center">
          <h2 className="font-display text-2xl">Nothing to map yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your current search returns no records.</p>
          <Link to="/app/discover" className="mt-4 inline-block text-sm text-primary hover:underline">Adjust search in Discover →</Link>
        </div>
      ) : view === "graph" ? (
        <div className="grid flex-1 lg:grid-cols-[1fr_320px]">
          <div className="relative h-[70vh] min-h-[480px] lg:h-[calc(100vh-240px)] lg:min-h-[560px]">
            {hydrated && status === "ready" ? (
              <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading graph…</p>}>
                <StoryGraph question={query} records={records} selectedId={sel?.id ?? null} savedIds={saved} onSelect={onSelect} />
              </Suspense>
            ) : (
              <p className="p-6 text-sm text-muted-foreground">Loading graph…</p>
            )}
          </div>
          <aside className="border-t border-border bg-card p-6 lg:border-l lg:border-t-0" aria-live="polite">
            {!sel || sel.kind === "question" || sel.kind === "video" ? (
              <div className="text-sm text-muted-foreground">
                <h2 className="eyebrow mb-2">Evidence index</h2>
                <p>No theme or perspective selected.</p>
              </div>
            ) : (
              <div>
                <p className="eyebrow">{sel.kind}</p>
                <h2 className="mt-1 font-display text-3xl">{sel.kind === "theme" ? themeOf(sel.ref).label : perspectiveOf(sel.ref).label}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{sel.kind === "theme" ? themeOf(sel.ref).description : perspectiveOf(sel.ref).description}</p>
                <h3 className="eyebrow mb-2 mt-6">Associated evidence · {panelRecords.length}</h3>
                <ul className="divide-y divide-border">
                  {panelRecords.map((r) => (
                    <li key={r.id} className="py-4">
                      <Button variant="editorial" type="button" onClick={() => openRecord(r.id)} className="text-left text-sm font-medium hover:text-primary">{r.title}</Button>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-[11px] text-muted-foreground">{r.id} · {r.platform}</span>
                        <SaveButton id={r.id} compact />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10">
          <h2 className="eyebrow mb-4">Themes and their records</h2>
          <div className="space-y-6">
            {[...g.themeCounts].map(([t, n]) => (
              <section key={t} className="border-t border-border pt-4">
                <h3 className="font-display text-2xl">{themeOf(t).label} <span className="font-mono text-sm text-muted-foreground">{n}</span></h3>
                <p className="text-sm text-muted-foreground">{themeOf(t).description}</p>
                <ul className="mt-3 space-y-1.5">
                  {records.filter((r) => r.themes.includes(t)).map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-3 text-sm">
                      <Button variant="editorial" type="button" onClick={() => openRecord(r.id)} className="text-left hover:text-primary">{r.title}</Button>
                      <span className="text-xs text-muted-foreground">{r.id} · perspective: {perspectiveOf(r.perspective).label}</span>
                      <SaveButton id={r.id} compact />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <h2 className="eyebrow mb-3 mt-10">Perspectives</h2>
          <ul className="space-y-1 text-sm">
            {[...g.perspCounts].map(([p, n]) => (
              <li key={p}><span className="font-medium">{perspectiveOf(p).label}</span> <span className="text-muted-foreground">— {n} records</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
