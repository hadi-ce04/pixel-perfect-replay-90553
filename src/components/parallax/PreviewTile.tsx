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
      aria-label={`Illustration for fictional record ${record.id}; no source footage`}
    >
      <TopicArt topic={record.topic} className="absolute inset-0 h-full w-full" />
      <span className="absolute left-2 top-2 rounded-sm bg-[#161c20] px-1.5 py-1 font-mono text-[9px] text-white">
        {record.id}
      </span>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-[#161c20] px-2 py-2 text-[9px] text-white">
        <span>Illustration · fictional record</span>
        <span className="font-mono">{formatTime(record.durationSeconds)}</span>
      </div>
    </div>
  );
}
