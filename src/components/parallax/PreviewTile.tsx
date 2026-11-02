import type { VideoRecord } from "@/lib/types";
import { formatTime } from "@/lib/format";

/** Graphic stand-in for footage. Deliberately not a play button. */
export function PreviewTile({ record, className = "" }: { record: VideoRecord; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden border border-border bg-card ${className}`}
      role="img"
      aria-label={`Graphic preview for fictional record ${record.id}; no footage available`}
    >
      <div className="absolute inset-x-3 top-1/2 border-t border-border" />
      <span className="absolute left-2 top-2 font-mono text-[10px] text-muted-foreground">{record.id}</span>
      <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">{record.platform}</span>
      <span className="absolute bottom-2 left-2 text-[10px] text-muted-foreground">No footage · fictional</span>
      <span className="absolute bottom-2 right-2 font-mono text-[10px] text-foreground">{formatTime(record.durationSeconds)}</span>
    </div>
  );
}
