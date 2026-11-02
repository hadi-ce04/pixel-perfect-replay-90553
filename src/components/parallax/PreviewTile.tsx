import type { VideoRecord } from "@/lib/types";
import { formatTime } from "@/lib/format";

const topicHue: Record<string, string> = {
  housing: "var(--signal)",
  groceries: "var(--chart-4)",
  transport: "var(--chart-3)",
  employment: "var(--chart-5)",
  climate: "var(--insight)",
};

/** Graphic stand-in for footage. Deliberately not a play button. */
export function PreviewTile({ record, className = "" }: { record: VideoRecord; className?: string }) {
  const hue = topicHue[record.topic];
  const seed = record.id.charCodeAt(4) + record.id.charCodeAt(6);
  const bars = Array.from({ length: 14 }, (_, i) => 20 + ((seed * (i + 3)) % 60));
  return (
    <div
      className={`relative overflow-hidden border border-border bg-muted ${className}`}
      role="img"
      aria-label={`Graphic preview for fictional record ${record.id}; no footage available`}
    >
      <div className="absolute inset-0 hairline-grid opacity-40" />
      <div className="absolute inset-x-3 bottom-8 flex h-1/2 items-end gap-[3px]">
        {bars.map((h, i) => (
          <span key={i} className="flex-1" style={{ height: `${h}%`, background: hue, opacity: 0.25 + (i % 4) * 0.12 }} />
        ))}
      </div>
      <span className="absolute left-2 top-2 font-mono text-[10px] text-muted-foreground">{record.id}</span>
      <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">{record.platform}</span>
      <span className="absolute bottom-2 left-2 text-[10px] text-muted-foreground">No footage · fictional</span>
      <span className="absolute bottom-2 right-2 font-mono text-[10px] text-foreground">{formatTime(record.durationSeconds)}</span>
    </div>
  );
}
