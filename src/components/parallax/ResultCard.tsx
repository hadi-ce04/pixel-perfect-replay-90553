import { Button } from "@/components/ui/button";
import { themeOf } from "@/data/catalog";
import type { SearchResult } from "@/lib/types";
import { useStore } from "@/lib/store";
import { formatDate, formatTime } from "@/lib/format";
import { SaveButton } from "./SaveButton";
import { PreviewTile } from "./PreviewTile";

export function ResultCard({ result }: { result: SearchResult }) {
  const { openRecord } = useStore();
  const { record, matchedExcerpt: ex } = result;
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
          {record.creatorLabel} · Fictional record
        </p>
        {ex && (
          <blockquote className="mt-4 border-l-2 border-primary pl-3 text-sm leading-relaxed text-foreground/85">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-primary">
              {ex.modality} · {formatTime(ex.startSeconds)}
            </span>
            {ex.modality === "visual" ? ex.excerpt : `“${ex.excerpt}”`}
          </blockquote>
        )}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {record.themes.map((t) => (
            <span
              key={t}
              className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground"
            >
              {themeOf(t).label}
            </span>
          ))}
        </div>
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
