import { Button } from "@/components/ui/button";
import "@/components/parallax/StoryTensions.css";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { briefToMarkdown, generateBrief } from "@/lib/brief";
import { useEvidenceCollection } from "@/lib/useEvidence";
import { useStore } from "@/lib/store";
import { formatDate, formatTime, formatTimeRange } from "@/lib/format";
import { FileSearch, RotateCcw } from "lucide-react";
import { briefPassages, type AiPassage } from "@/lib/ai-analysis";
import { useAiBrief } from "@/lib/useAiAnalysis";
import { AiCitations, AiProvenance, RELATIONSHIP_TEXT } from "@/components/parallax/AiCitations";

export const Route = createFileRoute("/app/brief")({
  head: () => ({
    meta: [
      { title: "Editorial brief — PARALLAX workspace" },
      {
        name: "description",
        content: "A deterministic brief generated from your saved evidence.",
      },
      { property: "og:title", content: "Editorial brief — PARALLAX workspace" },
      {
        property: "og:description",
        content: "A deterministic brief generated from your saved evidence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BriefPage,
});

function Ref({ id }: { id: string }) {
  const { openRecord } = useStore();
  return (
    <Button
      variant="editorial"
      type="button"
      onClick={() => openRecord(id)}
      className="font-mono text-xs text-primary hover:underline"
    >
      {id}
    </Button>
  );
}

function BriefPage() {
  const { saved, query, hydrated, reportingLead } = useStore();
  const { records, missingIds, isPending, isError, refetch } = useEvidenceCollection(
    saved,
    hydrated,
  );
  const passages = useMemo(() => briefPassages(query, records), [query, records]);
  const aiBrief = useAiBrief(passages, query);
  const brief = useMemo(
    () => generateBrief(query, records, reportingLead, undefined, aiBrief.result),
    [query, records, reportingLead, aiBrief.result],
  );
  // Story Tensions passages A and B, for mapping the saved AI comparison's citations.
  const leadPassages: AiPassage[] = brief.tensionExcerpts.map((e, i) => ({
    ref: i === 0 ? "A" : "B",
    recordId: e.recordId,
    title: e.title,
    creator: "",
    platform: "",
    publishedAt: "",
    modality: e.modality,
    startSeconds: e.startSeconds,
    endSeconds: e.endSeconds,
    excerpt: e.excerpt,
  }));
  const md = useMemo(
    () =>
      briefToMarkdown(brief) +
      (missingIds.length
        ? `\n\n## Unavailable saved records\nExcluded from this brief: ${missingIds.join(", ")}.`
        : ""),
    [brief, missingIds],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(md);
      toast.success("Brief copied to clipboard");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = md;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (ok) toast.success("Brief copied to clipboard");
      else toast.error("Clipboard unavailable — use Download instead");
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download =
      brief.dataMode === "mock" ? "parallax-demo-brief.md" : "parallax-editorial-brief.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!hydrated) return null;
  if (isPending)
    return (
      <p role="status" className="mx-auto max-w-3xl px-5 py-16 text-sm text-muted-foreground">
        Loading evidence for your brief…
      </p>
    );
  if (isError)
    return (
      <div role="alert" className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-3xl">Could not load the brief's evidence</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your selection is still saved. Retry before generating or exporting a brief.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  if (records.length === 0)
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center md:px-10">
        <h1 className="font-display text-4xl">Your brief starts with evidence</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {missingIds.length
            ? "Your saved records are unavailable from the current source. Review your saved evidence or select available records."
            : "Save at least one record and PARALLAX will assemble a brief strictly from what you selected."}
        </p>
        {missingIds.length > 0 && (
          <Link to="/app/saved" className="mt-4 block text-sm text-primary underline">
            Review unavailable records
          </Link>
        )}
        <Link
          to="/app/discover"
          className="mt-6 inline-block rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Find evidence
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-10">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex gap-2">
          <Button
            variant="editorial"
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs"
          >
            Copy brief
          </Button>
          <Button
            variant="editorial"
            type="button"
            onClick={download}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs"
          >
            Download .md
          </Button>
        </div>
      </div>
      <div className="mt-6 border border-border bg-secondary p-3 text-xs">
        {brief.dataMode === "mock"
          ? "Demonstration brief based on fictional records. Not real sources and not representative of public opinion."
          : brief.dataMode === "mixed"
            ? "This brief includes fictional demonstration records alongside source records. Replace fictional records before publication."
            : "Research brief based on selected source records. Claims require independent verification; the selection does not represent public opinion."}
      </div>

      <article className="mt-8 space-y-10 border-t border-foreground pt-8">
        {brief.reportingLead && (
          <section className="tensions-brief-lead" aria-label="Selected reporting question">
            <h2 className="text-2xl font-semibold tracking-tight">
              {brief.reportingLead.question}
            </h2>
            <p className="mt-2 text-xs font-semibold text-primary">
              Reporting question selected in Story Tensions
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              A question to investigate. Compare circumstances before treating the accounts as
              disagreement.
            </p>
            <ul className="mt-5 space-y-4">
              {brief.tensionExcerpts.map((e) => (
                <li key={e.recordId} className="border-l border-border pl-3">
                  <p className="text-sm leading-relaxed">
                    {e.modality === "visual" ? e.excerpt : `“${e.excerpt}”`}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Ref id={e.recordId} />
                    <span>
                      {e.modality} · {formatTimeRange(e.startSeconds, e.endSeconds)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            {brief.aiComparison && (
              <div className="mt-6 border-t border-border pt-5" aria-label="AI comparison of the selected passages">
                <h3 className="text-sm font-semibold">AI comparison of passages A and B</h3>
                <p className="mt-2 text-sm font-semibold">
                  {RELATIONSHIP_TEXT[brief.aiComparison.relationship]}
                </p>
                <p className="mt-1 text-sm leading-relaxed">{brief.aiComparison.summary}</p>
                <ul className="mt-4 space-y-4">
                  {brief.aiComparison.points.map((pt, i) => (
                    <li key={i} className="text-sm leading-relaxed">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {pt.kind === "difference"
                          ? "Difference"
                          : pt.kind === "common"
                            ? "Shared"
                            : "Missing context"}
                      </span>
                      <p>{pt.text}</p>
                      <AiCitations citations={pt.citations} passages={leadPassages} />
                    </li>
                  ))}
                </ul>
                <AiProvenance
                  model={brief.aiComparison.model}
                  generatedAt={brief.aiComparison.generatedAt}
                />
              </div>
            )}
          </section>
        )}
        {missingIds.length > 0 && (
          <p role="status" className="text-sm text-muted-foreground">
            {missingIds.length} unavailable saved records were excluded: {missingIds.join(", ")}.{" "}
            <Link to="/app/saved" className="text-primary underline">
              Review selection
            </Link>
          </p>
        )}
        <header>
          <h1 className="font-display text-4xl leading-tight md:text-5xl">
            <span className="sr-only">Research question: </span>
            {brief.question || "No research question set"}
          </h1>
        </header>

        <section aria-label="AI reading of the selected evidence" className="border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="text-lg font-bold tracking-tight">AI reading of the selected evidence</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                An AI model reads one passage from each of the {Math.min(records.length, 12)} saved
                records shown below{records.length > 12 ? " (the first 12)" : ""} and must quote them
                for every finding. Findings whose quotes are not found word for word are removed.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={aiBrief.run}
              disabled={aiBrief.status === "loading" || passages.length === 0}
              aria-busy={aiBrief.status === "loading"}
            >
              <FileSearch aria-hidden="true" className="mr-2 h-4 w-4" />
              {aiBrief.status === "loading"
                ? "Reading…"
                : aiBrief.result
                  ? "Generate again"
                  : "Generate AI reading"}
            </Button>
          </div>
          {aiBrief.status === "error" && (
            <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-destructive p-3 text-sm">
              <p>AI reading failed: {aiBrief.error}</p>
              <Button variant="outline" size="sm" onClick={aiBrief.run}>
                <RotateCcw aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          )}
          {brief.ai && aiBrief.status !== "loading" && (
            <div className="mt-5 space-y-6 border-t border-border pt-5">
              <p className="text-sm leading-relaxed">{brief.ai.overview}</p>
              {(
                [
                  ["Findings", brief.ai.findings],
                  ["Tensions between sources", brief.ai.tensions],
                ] as const
              ).map(([title, items]) =>
                items.length ? (
                  <div key={title}>
                    <h3 className="mb-2 text-sm font-semibold">{title}</h3>
                    <ul className="space-y-4">
                      {items.map((f, i) => (
                        <li key={i} className="text-sm leading-relaxed">
                          <p>{f.text}</p>
                          <AiCitations citations={f.citations} passages={passages} label="record" />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
              {(
                [
                  ["Gaps in the evidence", brief.ai.gaps],
                  ["What to verify", brief.ai.verification],
                  ["Possible angles", brief.ai.angles],
                ] as const
              ).map(([title, items]) =>
                items.length ? (
                  <div key={title}>
                    <h3 className="mb-2 text-sm font-semibold">{title}</h3>
                    <ul className="list-disc space-y-1.5 pl-5 text-sm">
                      {items.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
              {brief.ai.droppedPoints > 0 && (
                <p className="text-xs text-muted-foreground">
                  {brief.ai.droppedPoints} {brief.ai.droppedPoints === 1 ? "finding was" : "findings were"}{" "}
                  removed because the quoted words were not found in the passages.
                </p>
              )}
              <AiProvenance model={brief.ai.model} generatedAt={brief.ai.generatedAt} />
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Source coverage</h2>
          <dl className="grid grid-cols-2 gap-4 border-y border-border py-4 sm:grid-cols-4">
            <div className="py-1">
              <dd className="text-lg font-semibold">{brief.recordCount}</dd>
              <dt className="text-[11px] text-muted-foreground">Records included</dt>
            </div>
            {Object.entries(brief.platforms).map(([k, v]) => (
              <div key={k} className="py-1">
                <dd className="text-lg font-semibold">{v}</dd>
                <dt className="text-[11px] text-muted-foreground">{k}</dt>
              </div>
            ))}
            {brief.dateRange && (
              <div className="col-span-2 py-1 sm:col-span-1">
                <dd className="text-sm">
                  {formatDate(brief.dateRange[0])} – {formatDate(brief.dateRange[1])}
                </dd>
                <dt className="text-[11px] text-muted-foreground">Published range</dt>
              </div>
            )}
          </dl>
          {brief.topics.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">Topics: {brief.topics.join(", ")}</p>
          )}
        </section>

        {brief.interpretation && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">How the question was read</h2>
            <ul className="space-y-1.5 text-sm">
              {brief.interpretation.facets.map((f) => (
                <li key={f.key}>
                  <span className="font-medium">{f.label}</span>{" "}
                  <span className="text-muted-foreground">
                    —{" "}
                    {f.role === "context"
                      ? "context only, not used as a search constraint"
                      : `searched as ${f.terms.join(", ")}`}
                  </span>
                </li>
              ))}
            </ul>
            {brief.interpretation.notes.map((n) => (
              <p key={n} className="mt-2 text-xs text-muted-foreground">
                {n}
              </p>
            ))}
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Observed themes</h2>
          <ul className="divide-y divide-border">
            {brief.themes.map((t) => (
              <li key={t.id} className="py-3">
                <p className="font-medium">
                  {t.label}{" "}
                  <span className="font-mono text-xs text-muted-foreground">
                    {t.recordIds.length}/{brief.recordCount}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <p className="mt-1 flex flex-wrap gap-2">
                  {t.recordIds.map((id) => (
                    <Ref key={id} id={id} />
                  ))}
                </p>
                {t.supports && t.supports.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {t.supports.map((e, i) => (
                      <li key={`${e.recordId}-${i}`} className="border-l border-border pl-3 text-xs">
                        <span className="text-foreground/85">“{e.excerpt}”</span>{" "}
                        <span className="text-muted-foreground">
                          {e.recordId} · {e.modality} · {formatTimeRange(e.startSeconds, e.endSeconds)}
                          {e.shortened ? " · shortened" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            {brief.dataMode === "live" ? "Speaker perspectives" : "Contrasting perspectives"}
          </h2>
          <p className="text-sm">{brief.comparisonNote}</p>
          <ul className="mt-3 space-y-1.5">
            {brief.perspectives.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{p.label}</span>
                {p.recordIds.map((id) => (
                  <Ref key={id} id={id} />
                ))}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Supporting excerpts</h2>
          <ul className="space-y-4">
            {brief.excerpts.map((e) => (
              <li key={e.recordId} className="border-l border-border pl-4">
                <p className="font-display text-xl leading-snug">
                  {e.modality === "visual" ? e.excerpt : `“${e.excerpt}”`}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Ref id={e.recordId} /> · {e.modality} ·{" "}
                  {formatTimeRange(e.startSeconds, e.endSeconds)} · {e.title}
                  {e.shortened ? " · excerpt shortened" : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Questions requiring independent verification</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            {brief.verification.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Potential editorial angles</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            {brief.angles.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
