import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { perspectiveOf } from "@/data/catalog";
import { Highlight } from "@/components/parallax/Highlight";
import { formatTimeRange } from "@/lib/format";
import { excerptWindow } from "@/lib/text";
import type { EvidenceTheme } from "@/lib/analysis";
import { SaveButton } from "@/components/parallax/SaveButton";
import { buildStoryGraph, type GraphNodeKind } from "@/lib/graph";
import { useStore } from "@/lib/store";
import { useResults } from "@/lib/useResults";
import { useHydrated } from "@/lib/useHydrated";
import { StoryTensions } from "@/components/parallax/StoryTensions";
import { useSearchProvider } from "@/lib/provider-context";
import { comparisonThemes } from "@/lib/tensions";

const StoryGraph = lazy(() =>
  import("@/components/parallax/StoryGraph").then((m) => ({ default: m.StoryGraph })),
);

export const Route = createFileRoute("/app/story-dna")({
  head: () => ({
    meta: [
      { title: "Story DNA — PARALLAX workspace" },
      {
        name: "description",
        content: "See how themes, perspectives and video records connect in your investigation.",
      },
      { property: "og:title", content: "Story DNA — PARALLAX workspace" },
      {
        property: "og:description",
        content: "See how themes, perspectives and video records connect in your investigation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StoryDNA,
});

function StoryDNA() {
  const { query, saved, openRecord } = useStore();
  const { results, status, retry, info, analysis } = useResults();
  const live = useSearchProvider().mode === "live";
  const records = useMemo(() => results.map((r) => r.record), [results]);
  const [view, setView] = useState<"graph" | "list" | "tensions">("graph");
  const navigate = useNavigate();
  const [sel, setSel] = useState<{ id: string; kind: GraphNodeKind; ref: string } | null>(null);
  const hydrated = useHydrated();
  const g = useMemo(() => buildStoryGraph(query, records, analysis), [query, records, analysis]);

  const onSelect = (id: string, kind: GraphNodeKind, ref: string) => {
    setSel({ id, kind, ref });
    if (kind === "video") openRecord(ref);
  };

  const panelRecords =
    sel?.kind === "theme"
      ? records.filter((r) => analysis.byId[sel.ref]?.recordIds.includes(r.id))
      : sel?.kind === "perspective"
        ? records.filter((r) => r.perspective === sel.ref)
        : [];

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border px-5 py-8 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1
              className={`max-w-3xl font-display leading-tight ${view === "tensions" ? "text-2xl md:text-3xl" : "text-3xl md:text-5xl"}`}
            >
              {query || "All demonstration records"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {records.length} {live ? "source" : "fictional"} records · {g.themeCounts.size} themes
              · {g.perspCounts.size} perspective labels
            </p>
            {live && (
              <p className="mt-3 max-w-4xl text-xs leading-relaxed text-muted-foreground">
                Live source evidence. Themes are terms from your question and phrases that recur across
                records, each linked to the exact passages that contain them. A shared term is not a
                shared claim, and no speaker identity or stance is inferred. {info?.partial && "Oriane returned a partial response."}{" "}
                Only the current search page is represented.
              </p>
            )}
          </div>
          <div role="tablist" aria-label="View" className="flex border border-border">
            {(["graph", "list", "tensions"] as const).map((v) => (
              <Button
                variant="editorial"
                key={v}
                role="tab"
                aria-selected={view === v}
                type="button"
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-xs capitalize ${view === v ? "bg-foreground text-background hover:text-background" : "text-muted-foreground"}`}
              >
                {v === "tensions" ? "Story Tensions" : v}
              </Button>
            ))}
          </div>
        </div>
        {view !== "tensions" && (
          <ul
            className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground"
            aria-label="Legend"
          >
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 border-2 border-foreground" />
              Research question
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 border border-foreground" />
              Theme (count = records)
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 border border-border bg-background" />
              Video record
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-dashed border-foreground" />
              Perspective
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Saved
            </li>
          </ul>
        )}
      </div>

      {status === "ready" && records.length > 0 && view !== "tensions" && (
        <div className="tensions-entry">
          <div>
            <p>What do two accounts reveal together?</p>
            <span>
              Compare excerpts, inspect their context, and find your next reporting question.
            </span>
          </div>
          <Button variant="outline" onClick={() => setView("tensions")}>
            Explore Story Tensions<ArrowUpRight aria-hidden="true" className="ml-1 inline h-3.5 w-3.5 align-[-2px]" />
          </Button>
        </div>
      )}
      {status === "error" ? (
        <div role="alert" className="p-10">
          <h2 className="font-display text-2xl">Could not load Story DNA</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The source could not return the investigation records.
          </p>
          <Button variant="outline" className="mt-4" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : status === "ready" && records.length === 0 ? (
        <div className="p-10 text-center">
          <h2 className="font-display text-2xl">Nothing to map yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your current search returns no records.
          </p>
          <Link
            to="/app/discover"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Adjust search in Discover<ArrowRight aria-hidden="true" className="ml-1 inline h-3.5 w-3.5 align-[-2px]" />
          </Link>
        </div>
      ) : view === "tensions" ? (
        status === "loading" ? (
          <p role="status" className="p-8 text-sm text-muted-foreground">
            Loading comparison evidence…
          </p>
        ) : (
          <StoryTensions
            key={`${query}:${sel?.kind === "theme" ? sel.ref : ""}:${records.map((r) => r.id).join(",")}`}
            records={records}
            analysis={analysis}
            initialThemeId={sel?.kind === "theme" ? sel.ref : undefined}
            onOpenBrief={() => navigate({ to: "/app/brief" })}
          />
        )
      ) : view === "graph" ? (
        <div className="grid lg:grid-cols-[1fr_280px]">
          <div className="relative h-[560px] lg:h-[660px]">
            {hydrated && status === "ready" ? (
              <Suspense
                fallback={<p className="p-6 text-sm text-muted-foreground">Loading graph…</p>}
              >
                <StoryGraph
                  question={query}
                  records={records}
                  analysis={analysis}
                  selectedId={sel?.id ?? null}
                  savedIds={saved}
                  onSelect={onSelect}
                />
              </Suspense>
            ) : (
              <p className="p-6 text-sm text-muted-foreground">Loading graph…</p>
            )}
          </div>
          <aside
            className="border-t border-border bg-card p-6 lg:border-l lg:border-t-0"
            aria-live="polite"
          >
            {!sel || sel.kind === "question" || sel.kind === "video" ? (
              <div className="text-sm text-muted-foreground">
                <h2 className="mb-2 text-sm font-semibold text-foreground">Evidence index</h2>
                <p>No theme or perspective selected.</p>
              </div>
            ) : (
              <div>
                <h2 className="font-display text-3xl">
                  {sel.kind === "theme"
                    ? (analysis.byId[sel.ref]?.label ?? sel.ref)
                    : perspectiveOf(sel.ref).label}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {sel.kind === "theme" ? "Theme" : "Perspective label"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {sel.kind === "theme"
                    ? (analysis.byId[sel.ref]?.description ?? "")
                    : perspectiveOf(sel.ref).description}
                </p>
                {sel.kind === "theme" && comparisonThemes(panelRecords, analysis).includes(sel.ref) && (
                  <Button
                    variant="outline"
                    className="mt-5 w-full text-xs"
                    onClick={() => setView("tensions")}
                  >
                    Compare this theme<ArrowUpRight aria-hidden="true" className="ml-1 inline h-3.5 w-3.5 align-[-2px]" />
                  </Button>
                )}
                <h3 className="mb-2 mt-6 text-sm font-semibold text-foreground">Associated evidence{" "}
                  <span className="font-mono text-muted-foreground">{panelRecords.length}</span></h3>
                <ul className="divide-y divide-border">
                  {panelRecords.map((r) => (
                    <li key={r.id} className="py-4">
                      <Button
                        variant="editorial"
                        type="button"
                        onClick={() => openRecord(r.id)}
                        className="text-left text-sm font-medium hover:text-primary"
                      >
                        {r.title}
                      </Button>
                      {sel.kind === "theme" && analysis.byId[sel.ref] && (
                        <SupportQuote theme={analysis.byId[sel.ref]!} recordId={r.id} />
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {r.id} · {r.platform}
                        </span>
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
          <h2 className="mb-4 text-sm font-semibold text-foreground">Themes and their records</h2>
          <div className="space-y-6">
            {[...g.themeCounts].map(([t, n]) => (
              <section key={t} className="border-t border-border pt-4">
                <h3 className="font-display text-2xl">
                  {analysis.byId[t]?.label ?? t}{" "}
                  <span className="font-mono text-sm text-muted-foreground">{n}</span>
                </h3>
                <p className="text-sm text-muted-foreground">{analysis.byId[t]?.description}</p>
                <ul className="mt-3 space-y-3">
                  {records
                    .filter((r) => analysis.byId[t]?.recordIds.includes(r.id))
                    .map((r) => (
                      <li key={r.id} className="text-sm">
                        <div className="flex flex-wrap items-center gap-3">
                        <Button
                          variant="editorial"
                          type="button"
                          onClick={() => openRecord(r.id)}
                          className="text-left hover:text-primary"
                        >
                          {r.title}
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {r.id} · perspective: {perspectiveOf(r.perspective).label}
                        </span>
                        <SaveButton id={r.id} compact />
                        </div>
                        {analysis.byId[t] && <SupportQuote theme={analysis.byId[t]!} recordId={r.id} />}
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
          <h2 className="mb-3 mt-10 text-sm font-semibold text-foreground">Perspectives</h2>
          <ul className="space-y-1 text-sm">
            {[...g.perspCounts].map(([p, n]) => (
              <li key={p}>
                <span className="font-medium">{perspectiveOf(p).label}</span>{" "}
                <span className="text-muted-foreground">— {n} records</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** The first exact passage in a record that supports a theme, with its timing. */
function SupportQuote({ theme, recordId }: { theme: EvidenceTheme; recordId: string }) {
  const ref = theme.supports.find((s) => s.recordId === recordId && s.field !== "record");
  if (!ref) return null;
  const shown = excerptWindow(ref.excerpt, ref.match, 280);
  return (
    <blockquote className="mt-2 border-l border-border pl-3 text-xs leading-relaxed text-foreground/85">
      <span className="mb-0.5 block font-mono text-[10px] text-muted-foreground">
        {ref.modality} · {formatTimeRange(ref.startSeconds, ref.endSeconds)}
      </span>
      “<Highlight text={shown.text} terms={theme.terms} />”
      {shown.shortened && <span className="ml-1 text-[10px] text-muted-foreground">(shortened)</span>}
    </blockquote>
  );
}
