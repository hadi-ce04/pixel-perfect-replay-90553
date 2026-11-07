import { Button } from "@/components/ui/button";
import type { SearchResult } from "@/lib/types";
import type { EvidenceTheme } from "@/lib/analysis";
import { useStore } from "@/lib/store";
import { formatDate, formatTime } from "@/lib/format";
import { SaveButton } from "./SaveButton";
import { PreviewTile } from "./PreviewTile";
import { Highlight } from "./Highlight";

const CHIP: Record<EvidenceTheme["kind"], string> = {
  "question-term": "border-primary text-foreground",
  "recurring-phrase": "border-border text-muted-foreground",
  hashtag: "border-dashed border-border text-muted-foreground",
  catalog: "border-border text-muted-foreground",
  "legacy-keyword": "border-dashed border-border text-muted-foreground",
};

export function ResultCard({
  result,
  themes = [],
  searchTermCount,
}: {
  result: SearchResult;
  themes?: EvidenceTheme[];
  searchTermCount?: number | undefined;
}) {
  const { openRecord } = useStore();
  const { record, matchedExcerpt: ex } = result;
  const questionTerms = themes.filter((t) => t.kind === "question-term");
  const highlightTerms = questionTerms.flatMap((t) => t.terms);
  return (
    <article className="grid gap-5 border-b border-border py-6 sm:grid-cols-[145px_1fr]">
      <button
        type="button"
        className="self-start rounded-md text-left"
        onClick={() => openRecord(record.id)}
        aria-label={`Inspect ${record.title}`}
      >
        <PreviewTile record={record} className="aspect-[4/3] sm:aspect-[3/4]" />
      </button>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {record.platform} <span className="mx-2 text-primary">/</span> {record.contentType}{" "}
          <span className="mx-2">·</span> {formatDate(record.publishedAt)}
        </p>
        <h3 className="mt-2 font-display text-xl leading-snug">{record.title}</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          {record.creatorLabel} ·{" "}
          {record.dataMode === "mock" ? "Fictional record" : "Oriane source record"}
        </p>
        {ex && (
          <blockquote className="mt-4 border-l-2 border-primary pl-3 text-sm leading-relaxed text-foreground/85">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-primary">
              {ex.modality} · {formatTime(ex.startSeconds)}
            </span>
            {ex.modality === "visual" ? (
              ex.excerpt
            ) : (
              <>
                “<Highlight text={ex.excerpt} terms={highlightTerms} />”
              </>
            )}
          </blockquote>
        )}
        {record.dataMode === "live" && searchTermCount !== undefined && searchTermCount > 0 && (
          <p className="mt-3 text-[11px] text-muted-foreground">
            Passages contain {questionTerms.length} of {searchTermCount} question{" "}
            {searchTermCount === 1 ? "term" : "terms"}
            {result.matchedFacets && result.matchedFacets.length > questionTerms.length
              ? ` · Oriane matched ${result.matchedFacets.length} in indexed text`
              : ""}
          </p>
        )}
        {themes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Themes">
            {themes.map((t) => (
              <span
                key={t.id}
                title={t.description}
                className={`rounded border px-2 py-1 text-[10px] ${CHIP[t.kind]}`}
              >
                {t.label}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button
            variant="editorial"
            type="button"
            onClick={() => openRecord(record.id)}
            className="text-xs font-semibold text-primary"
          >
            Inspect evidence ↗
          </Button>
          <SaveButton id={record.id} />
        </div>
      </div>
    </article>
  );
}
