import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export function SaveButton({ id, compact = false }: { id: string; compact?: boolean }) {
  const { isSaved, toggleSaved } = useStore();
  const saved = isSaved(id);
  return (
    <Button variant="editorial"
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleSaved(id);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${id} from saved evidence` : `Save ${id} as evidence`}
      className={`inline-flex items-center gap-1.5 border-b px-1 py-1 text-xs font-medium transition-colors ${
        saved ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {saved ? "Saved" : compact ? "Save" : "Save evidence"}
    </Button>
  );
}
