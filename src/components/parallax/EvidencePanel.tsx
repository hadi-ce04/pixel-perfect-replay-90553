import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { perspectiveOf, themeOf, topicOf } from "@/data/catalog";
import { useEvidenceRecord } from "@/lib/useEvidence";
import { useStore } from "@/lib/store";
import { formatDate, formatTime, formatTimeRange } from "@/lib/format";
import { SaveButton } from "./SaveButton";
import { Highlight } from "./Highlight";

import { planQuery, searchableFacets } from "@/lib/query-plan";
import { findTerm } from "@/lib/text";

export function EvidencePanel() {
  const { openId, closeRecord, query } = useStore();
  const { data: record, isPending, isError, refetch } = useEvidenceRecord(openId);
  const live = record?.dataMode === "live";
  // Question terms are matched against this record's own passages only.
  const facetHits = useMemo(() => {
    if (!record || record.dataMode !== "live") return [];
    const plan = planQuery(query);
    return searchableFacets(plan).map((f) => ({
      facet: f,
      passages: record.evidence.filter((e) => findTerm(e.excerpt, f.terms)).length,
      caption: !!findTerm(record.description, f.terms),
    }));
  }, [record, query]);
  const highlightTerms = facetHits.flatMap((h) => h.facet.terms);
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => setActive(null), [openId]);

  return (
    <Sheet open={openId !== null} onOpenChange={(o) => !o && closeRecord()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-border bg-card p-0 sm:max-w-xl"
      >
        {!record && (
          <SheetHeader className="p-6 pr-12 text-left">
            <SheetTitle>
              {isPending
                ? "Loading evidence…"
                : isError
                  ? "Could not load evidence"
                  : "Evidence unavailable"}
            </SheetTitle>
            <SheetDescription>
              {isPending
                ? "Retrieving the selected record."
                : isError
                  ? "The source could not be reached. Your saved selection is unchanged."
                  : "This record is no longer available from the current source."}
            </SheetDescription>
            {isError && (
              <Button type="button" variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            )}
          </SheetHeader>
        )}
        {record && (
          <div className="flex flex-col">
            <SheetHeader className="space-y-3 border-b border-border p-6 pr-12 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium">
                  {record.dataMode === "mock" ? "Fictional demonstration record" : "Source record"}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{record.id}</span>
              </div>
              <SheetTitle className="font-display text-3xl leading-tight text-foreground">
                {record.title}
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                {record.description}
              </SheetDescription>
              <div>
                <SaveButton id={record.id} />
              </div>
            </SheetHeader>

            <div className="space-y-6 p-6">
              <p className="border-b border-border pb-4 text-xs text-muted-foreground">
                {record.dataMode === "mock"
                  ? "Fictional source. No footage or external source is available."
                  : "Inspect the excerpts and original source before using this record in reporting."}
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {[
                  ["Source", record.creatorLabel],
                  ["Platform", record.platform],
                  ["Published", formatDate(record.publishedAt)],
                  ["Duration", formatTime(record.durationSeconds)],
                  ["Content type", record.contentType],
                  ["Topic", live ? "Not classified" : topicOf(record.topic).label],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>

              {record.dataMode === "live" && (
                <p className="border border-border p-3 text-xs text-muted-foreground">
                  Highlighted words are terms from your current question found in this source's own
                  text. Speaker perspective and editorial content type have not been classified.
                  Media item numbers identify separate items in the source post.
                </p>
              )}
              <section>
                <h3 className="mb-3 text-sm font-semibold">Evidence excerpts</h3>
                {record.evidence.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No transcript or on-screen text was supplied for this record.
                  </p>
                )}
                <p className="mb-3 text-xs text-muted-foreground">
                  {record.dataMode === "mock"
                    ? "Timestamped passages from the fictional record."
                    : "Timestamped passages supplied by the source. Select a passage to highlight it."}
                </p>
                <ol className="space-y-2">
                  {record.evidence.map((e, i) => (
                    <li key={i}>
                      <Button
                        variant="editorial"
                        type="button"
                        onClick={() => setActive(i)}
                        aria-pressed={active === i}
                        className={`block h-auto w-full rounded-sm border p-3 text-left transition-colors ${
                          active === i
                            ? "border-primary bg-secondary"
                            : "border-border hover:border-foreground/25"
                        }`}
                      >
                        <div className="mb-1.5 flex items-center gap-2 text-xs">
                          <span className="font-mono text-primary">
                            {formatTimeRange(e.startSeconds, e.endSeconds)}
                          </span>
                          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-muted-foreground">
                            {e.modality}
                          </span>
                          {(record.sourceMediaCount ?? 0) > 1 && (
                            <span>Media item {(e.mediaIndex ?? 0) + 1}</span>
                          )}
                        </div>
                        <p className="font-display text-xl leading-relaxed">
                          {e.modality === "visual" ? (
                            e.excerpt
                          ) : (
                            <>
                              “<Highlight text={e.excerpt} terms={highlightTerms} />”
                            </>
                          )}
                        </p>
                      </Button>
                    </li>
                  ))}
                </ol>
              </section>

              {live ? (
                <section>
                  <h3 className="mb-2 text-sm font-semibold">Question terms in this source</h3>
                  {facetHits.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No search terms in the current question.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {facetHits.map(({ facet, passages, caption }) => (
                        <li key={facet.key} className="text-sm">
                          <span className="font-medium">{facet.label}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            —{" "}
                            {passages
                              ? `${passages} ${passages === 1 ? "passage" : "passages"}`
                              : "not found in the returned passages"}
                            {caption ? "; also in the caption" : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    A matching word shows what the text contains, not what the speaker claims.
                  </p>
                </section>
              ) : (
                <section>
                  <h3 className="mb-2 text-sm font-semibold">Themes</h3>
                  <ul className="space-y-2">
                    {record.themes.map((t) => (
                      <li key={t} className="text-sm">
                        <span className="font-medium">{themeOf(t).label}</span>
                        <span className="text-muted-foreground"> — {themeOf(t).description}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h3 className="mb-2 text-sm font-semibold">Perspective</h3>
                <p className="text-sm">
                  <span className="font-medium">{perspectiveOf(record.perspective).label}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {perspectiveOf(record.perspective).description}
                  </span>
                </p>
              </section>

              <section className="border-t border-border pt-4 text-sm">
                <h3 className="mb-2 text-sm font-semibold">Context notes</h3>
                <p className="text-muted-foreground">
                  {record.dataMode === "mock"
                    ? "The creator label is a generic descriptor, not a real account. Claims and figures in this record are invented for demonstration and must not be cited."
                    : "Source attribution and claims require independent verification. Excerpts reflect the retrieved record, not verified conclusions."}
                </p>
                <p className="mt-2">
                  {record.sourceUrl ? (
                    <a
                      href={record.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      Open external source
                    </a>
                  ) : (
                    <span className="text-muted-foreground">
                      {record.dataMode === "mock"
                        ? "No external source — fictional example."
                        : "No external source URL supplied."}
                    </span>
                  )}
                </p>
              </section>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
