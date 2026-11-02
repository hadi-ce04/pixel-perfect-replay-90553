import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { themeOf } from "@/data/catalog";
import { PreviewTile } from "@/components/parallax/PreviewTile";
import { recordById } from "@/lib/provider";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/app/saved")({
  head: () => ({
    meta: [
      { title: "Saved evidence — PARALLAX workspace" },
      { name: "description", content: "Your collection of saved demonstration evidence records." },
      { property: "og:title", content: "Saved evidence — PARALLAX workspace" },
      { property: "og:description", content: "Your collection of saved demonstration evidence records." },
    ],
  }),
  component: Saved,
});

function Saved() {
  const { saved, removeSaved, clearSaved, openRecord, hydrated } = useStore();
  const records = saved.map(recordById).filter((r) => r !== null);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-10">
      <p className="eyebrow">Workspace · Saved evidence</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl md:text-5xl">Saved evidence <span className="font-mono text-xl text-muted-foreground">{records.length}</span></h1>
        {records.length > 0 && (
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button type="button" className="rounded-sm border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground">Clear collection</button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card">
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all saved evidence?</AlertDialogTitle>
                  <AlertDialogDescription>This removes {records.length} records from your collection in this browser.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearSaved}>Clear collection</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Link to="/app/brief" className="rounded-sm bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">Create editorial brief →</Link>
          </div>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Stored locally in this browser. All records are fictional.</p>

      {!hydrated ? null : records.length === 0 ? (
        <div className="mt-10 border border-dashed border-border p-10 text-center">
          <h2 className="font-display text-2xl">No evidence saved yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Save records from Discover, Story DNA or the evidence panel to build your collection.</p>
          <Link to="/app/discover" className="mt-4 inline-block text-sm text-primary hover:underline">Go to Discover →</Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border border-y border-border">
          {records.map((r) => (
            <li key={r.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center">
              <PreviewTile record={r} className="h-20 w-full shrink-0 sm:w-32" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] text-muted-foreground">{r.id} · {r.platform} · {formatDate(r.publishedAt)}</p>
                <h2 className="font-display text-xl leading-snug">{r.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{r.themes.map((t) => themeOf(t).label).join(" · ")}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openRecord(r.id)} className="rounded-sm border border-border px-3 py-1.5 text-xs">Open</button>
                <button type="button" onClick={() => removeSaved(r.id)} className="rounded-sm border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground" aria-label={`Remove ${r.id}`}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
