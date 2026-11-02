import { Button } from "@/components/ui/button";
import { themeOf } from "@/data/catalog";
import type { SearchResult } from "@/lib/types";
import { useStore } from "@/lib/store";
import { formatDate, formatTime } from "@/lib/format";
import { SaveButton } from "./SaveButton";

export function ResultCard({ result }: { result: SearchResult }) {
  const { openRecord } = useStore();
  const { record, matchedExcerpt: ex } = result;
  return (
    <article className="grid gap-4 border-b border-border py-5 md:grid-cols-[150px_1fr]">
      <div className="space-y-1 text-xs text-muted-foreground">
          <span className="font-mono">{record.id}</span>
          <p>{record.platform} · {formatTime(record.durationSeconds)}</p>
          <p>{formatDate(record.publishedAt)}</p>
          <p>{record.contentType}</p>
      </div>
      <div className="flex min-w-0 flex-col">
        <p className="text-xs text-muted-foreground">{record.creatorLabel} · Fictional record</p>
        <h3 className="mt-1 font-display text-2xl leading-snug">{record.title}</h3>
        {ex && (
          <blockquote className="mt-3 border-l border-primary pl-3 font-display text-lg leading-snug">
            <span className="mr-2 font-sans text-[11px] font-semibold uppercase text-primary">{ex.modality} · {formatTime(ex.startSeconds)}</span>
            {ex.modality === "visual" ? ex.excerpt : `“${ex.excerpt}”`}
          </blockquote>
        )}
        <p className="mt-3 text-xs text-muted-foreground">{record.themes.map((t) => themeOf(t).label).join(" · ")}</p>
        <div className="mt-4 flex items-center gap-4">
          <Button variant="editorial"
            type="button"
            onClick={() => openRecord(record.id)}
            className="text-xs font-semibold underline hover:text-primary"
          >
            Open evidence
          </Button>
          <SaveButton id={record.id} />
        </div>
      </div>
    </article>
  );
}
