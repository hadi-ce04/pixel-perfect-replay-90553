import type { VideoRecord } from "@/lib/types";
import { formatTime } from "@/lib/format";
import { TopicArt } from "./TopicArt";

export function PreviewTile({
  record,
  className = "",
}: {
  record: VideoRecord;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-md border border-border ${className}`}
      role="img"
      aria-label={
        record.dataMode === "mock"
          ? `Illustration for fictional record ${record.id}; no source footage`
          : `Source preview for ${record.title}`
      }
    >
      {record.dataMode === "live" ? (
        record.thumbnailUrl ? (
          <img
            src={record.thumbnailUrl}
            alt="Source thumbnail"
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-card p-4 text-center text-xs text-muted-foreground">
            No thumbnail supplied
          </span>
        )
      ) : (
        <TopicArt
          topic={record.topic === "unclassified" ? "housing" : record.topic}
          className="absolute inset-0 h-full w-full"
        />
      )}
      <span className="absolute left-2 top-2 rounded-sm bg-foreground px-1.5 py-1 font-mono text-[10px] text-background">
        {record.id}
      </span>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-card px-2 py-2 text-[10px] text-foreground">
        <span>
          {record.dataMode === "mock" ? "Illustration · fictional record" : "Source thumbnail"}
        </span>
        <span className="font-mono">{formatTime(record.durationSeconds)}</span>
      </div>
    </div>
  );
}
