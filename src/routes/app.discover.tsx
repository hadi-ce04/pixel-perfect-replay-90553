import { createFileRoute, Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { TOPICS, topicOf } from "@/data/catalog";
import { ResultCard } from "@/components/parallax/ResultCard";
import { SearchBar } from "@/components/parallax/SearchBar";
import { useStore } from "@/lib/store";
import { useResults } from "@/lib/useResults";
import { emptyFilters, type ContentType, type Platform, type SearchFilters, type TopicId } from "@/lib/types";

export const Route = createFileRoute("/app/discover")({
  head: () => ({
    meta: [
      { title: "Discover — PARALLAX workspace" },
      { name: "description", content: "Search fictional demonstration video records by question, topic, platform and date." },
      { property: "og:title", content: "Discover — PARALLAX workspace" },
      { property: "og:description", content: "Search fictional demonstration video records by question, topic, platform and date." },
    ],
  }),
  component: Discover,
});

const PLATFORMS: Platform[] = ["TikTok", "Instagram"];
const TYPES: ContentType[] = ["Testimonial", "Street interview", "Explainer", "Vlog", "Commentary"];

function toggle<T>(arr: T[], v: T) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-sm border px-2.5 py-1 text-xs transition-colors ${active ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function Discover() {
  const { query, filters, setFilters, runSearch } = useStore();
  const { results, status, error } = useResults();
  const set = (f: Partial<SearchFilters>) => setFilters({ ...filters, ...f });

  const active: { label: string; clear: () => void }[] = [
    ...filters.platforms.map((p) => ({ label: p, clear: () => set({ platforms: filters.platforms.filter((x) => x !== p) }) })),
    ...filters.topics.map((t) => ({ label: topicOf(t).label, clear: () => set({ topics: filters.topics.filter((x) => x !== t) }) })),
    ...filters.contentTypes.map((c) => ({ label: c, clear: () => set({ contentTypes: filters.contentTypes.filter((x) => x !== c) }) })),
    ...(filters.from ? [{ label: `From ${filters.from}`, clear: () => set({ from: null }) }] : []),
    ...(filters.to ? [{ label: `To ${filters.to}`, clear: () => set({ to: null }) }] : []),
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-10">
      <p className="eyebrow">Workspace · Discover</p>
      <h1 className="mt-2 font-display text-4xl md:text-5xl">Discover</h1>
      <div className="mt-6">
        <SearchBar size="md" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside aria-label="Filters" className="space-y-6">
          <fieldset>
            <legend className="eyebrow mb-2">Platform</legend>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => (
                <Chip key={p} active={filters.platforms.includes(p)} onClick={() => set({ platforms: toggle(filters.platforms, p) })}>{p}</Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="eyebrow mb-2">Topic</legend>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map((t) => (
                <Chip key={t.id} active={filters.topics.includes(t.id)} onClick={() => set({ topics: toggle<TopicId>(filters.topics, t.id) })}>{t.label}</Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="eyebrow mb-2">Content type</legend>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((c) => (
                <Chip key={c} active={filters.contentTypes.includes(c)} onClick={() => set({ contentTypes: toggle(filters.contentTypes, c) })}>{c}</Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="eyebrow mb-2">Published</legend>
            <label className="block text-xs text-muted-foreground">
              From
              <input type="date" value={filters.from ?? ""} onChange={(e) => set({ from: e.target.value || null })} className="mt-1 block w-full rounded-sm border border-input bg-card px-2 py-1.5 text-sm text-foreground [color-scheme:dark]" />
            </label>
            <label className="block text-xs text-muted-foreground">
              To
              <input type="date" value={filters.to ?? ""} onChange={(e) => set({ to: e.target.value || null })} className="mt-1 block w-full rounded-sm border border-input bg-card px-2 py-1.5 text-sm text-foreground [color-scheme:dark]" />
            </label>
          </fieldset>
        </aside>

        <section aria-live="polite" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-4">
            <p className="mr-2 text-sm">
              <span className="font-mono text-primary">{status === "ready" ? results.length : "…"}</span>{" "}
              <span className="text-muted-foreground">
                demonstration {results.length === 1 ? "record" : "records"} {query ? <>for “{query}”</> : "(no query — showing all)"}
              </span>
            </p>
            {active.map((a) => (
              <button key={a.label} type="button" onClick={a.clear} className="inline-flex items-center gap-1 rounded-sm bg-secondary px-2 py-0.5 text-xs" aria-label={`Remove filter ${a.label}`}>
                {a.label} <X className="h-3 w-3" />
              </button>
            ))}
            {active.length > 0 && (
              <button type="button" onClick={() => setFilters(emptyFilters)} className="text-xs text-primary hover:underline">Clear all</button>
            )}
            {results.length > 0 && (
              <Link to="/app/story-dna" className="ml-auto text-xs text-primary hover:underline">View as Story DNA →</Link>
            )}
          </div>

          {status === "loading" && (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse border border-border bg-card" />)}</div>
          )}
          {status === "error" && <p className="border border-destructive p-4 text-sm">Search failed: {error}</p>}
          {status === "ready" && results.length === 0 && (
            <div className="border border-dashed border-border p-10 text-center">
              <h2 className="font-display text-2xl">No records match</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                The demonstration dataset covers housing, groceries, transport, youth employment and climate. Try broader words or remove filters.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {active.length > 0 && <button type="button" onClick={() => setFilters(emptyFilters)} className="rounded-sm border border-border px-3 py-1.5 text-xs">Clear filters</button>}
                <button type="button" onClick={() => runSearch(TOPICS[0].question)} className="rounded-sm border border-border px-3 py-1.5 text-xs">Try the housing question</button>
              </div>
            </div>
          )}
          {status === "ready" && results.length > 0 && (
            <div className="space-y-3">{results.map((r) => <ResultCard key={r.record.id} result={r} />)}</div>
          )}
        </section>
      </div>
    </div>
  );
}
