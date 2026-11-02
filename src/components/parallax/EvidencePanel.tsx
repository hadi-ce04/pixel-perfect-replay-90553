import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { perspectiveOf, themeOf, topicOf } from "@/data/catalog";
import { recordById } from "@/lib/provider";
import { useStore } from "@/lib/store";
import { formatDate, formatTime } from "@/lib/format";
import { PreviewTile } from "./PreviewTile";
import { SaveButton } from "./SaveButton";

export function EvidencePanel() {
  const { openId, closeRecord } = useStore();
  const record = openId ? recordById(openId) : null;
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => setActive(null), [openId]);

  return (
    <Sheet open={!!record} onOpenChange={(o) => !o && closeRecord()}>
      <SheetContent side="right" className="w-full overflow-y-auto border-border bg-card p-0 sm:max-w-xl">
        {record && (
          <div className="flex flex-col">
            <SheetHeader className="space-y-3 border-b border-border p-6 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-sm border border-insight/40 bg-insight/10 px-2 py-0.5 text-[11px] font-medium">
                  Fictional demonstration record
                </span>
                <span className="font-mono text-xs text-muted-foreground">{record.id}</span>
              </div>
              <SheetTitle className="font-display text-3xl leading-tight text-foreground">{record.title}</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">{record.description}</SheetDescription>
              <div>
                <SaveButton id={record.id} />
              </div>
            </SheetHeader>

            <div className="space-y-6 p-6">
              <PreviewTile record={record} className="aspect-video w-full" />
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                {[
                  ["Source", record.creatorLabel],
                  ["Platform", record.platform],
                  ["Published", formatDate(record.publishedAt)],
                  ["Duration", formatTime(record.durationSeconds)],
                  ["Content type", record.contentType],
                  ["Topic", topicOf(record.topic).label],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="eyebrow">{k}</dt>
                    <dd className="mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>

              <section>
                <h3 className="eyebrow mb-3">Evidence excerpts</h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  Timestamps highlight the matching excerpt. No video exists to play.
                </p>
                <ol className="space-y-2">
                  {record.evidence.map((e, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => setActive(i)}
                        aria-pressed={active === i}
                        className={`w-full rounded-sm border p-3 text-left transition-colors ${
                          active === i ? "border-primary bg-primary/10" : "border-border hover:border-foreground/25"
                        }`}
                      >
                        <div className="mb-1.5 flex items-center gap-2 text-xs">
                          <span className="font-mono text-primary">
                            {formatTime(e.startSeconds)}–{formatTime(e.endSeconds)}
                          </span>
                          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-muted-foreground">{e.modality}</span>
                        </div>
                        <p className="text-sm leading-relaxed">
                          {e.modality === "visual" ? e.excerpt : `“${e.excerpt}”`}
                        </p>
                      </button>
                    </li>
                  ))}
                </ol>
              </section>

              <section>
                <h3 className="eyebrow mb-2">Themes</h3>
                <ul className="space-y-2">
                  {record.themes.map((t) => (
                    <li key={t} className="text-sm">
                      <span className="font-medium">{themeOf(t).label}</span>
                      <span className="text-muted-foreground"> — {themeOf(t).description}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="eyebrow mb-2">Perspective</h3>
                <p className="text-sm">
                  <span className="font-medium">{perspectiveOf(record.perspective).label}</span>
                  <span className="text-muted-foreground"> — {perspectiveOf(record.perspective).description}</span>
                </p>
              </section>

              <section className="rounded-sm border border-border bg-muted/50 p-4 text-sm">
                <h3 className="eyebrow mb-2">Context notes</h3>
                <p className="text-muted-foreground">
                  The creator label is a generic descriptor, not a real account. Claims and figures in this record are invented
                  for demonstration and must not be cited.
                </p>
                <p className="mt-2">
                  {record.sourceUrl ? (
                    <a href={record.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                      Open external source
                    </a>
                  ) : (
                    <span className="text-muted-foreground">No external source — fictional example.</span>
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
