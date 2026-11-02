import { Bookmark, BookmarkCheck } from "lucide-react";
import { useStore } from "@/lib/store";

export function SaveButton({ id, compact = false }: { id: string; compact?: boolean }) {
  const { isSaved, toggleSaved } = useStore();
  const saved = isSaved(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleSaved(id);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${id} from saved evidence` : `Save ${id} as evidence`}
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        saved ? "border-primary/60 bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      }`}
    >
      {saved ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5" />}
      {!compact && (saved ? "Saved" : "Save")}
    </button>
  );
}
