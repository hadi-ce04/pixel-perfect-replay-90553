import { themeById } from "@/data/catalog";
import type { SearchResult } from "@/lib/types";
import { useStore } from "@/lib/store";
import { formatDate, formatTime } from "@/lib/format";
import { PreviewTile } from "./PreviewTile";
import { SaveButton } from "./SaveButton";

export function ResultCard({ result }: { result: SearchResult }) {
  const { openRecord } = useStore();
  const { record, matchedExcerpt: ex } = result;
  return (
    <article className="group grid gap-4 border border-border bg-card p-4 transition-colors hover:border-foreground/20 sm:grid-cols-[180px_1fr]">
      <PreviewTile record={record} className="aspect-[4/3] w-full sm:aspect-auto sm:h-full sm:min-h-[140px]" />
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-mono">{record.id}</span>
          <span>{record.creatorLabel}</span>
          <span>{record.platform}</span>
          <span>{formatDate(record.publishedAt)}</span>
          <span>{formatTime(record.durationSeconds)}</span>
          <span>{record.contentType}</span>
        </div>
        <h3 className="mt-2 font-display text-2xl leading-snug">{record.title}</h3>
        {ex && (
          <blockquote className="mt-2 border-l-2 border-primary pl-3 text-sm text-muted-foreground">
            <span className="mr-2 rounded-sm bg-muted px-1.5 py-0.5 text-[11px] text-foreground">{ex.modality}</span>
            {ex.modality === "visual" ? ex.excerpt : `“${ex.excerpt}”`}
          </blockquote>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {record.themes.map((t) => (
            <span key={t} className="rounded-sm border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              {themeById[t].label}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 sm:mt-auto sm:pt-4">
          <button
            type="button"
            onClick={() => openRecord(record.id)}
            className="rounded-sm bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
          >
            Open evidence
          </button>
          <SaveButton id={record.id} />
        </div>
      </div>
    </article>
  );
}
