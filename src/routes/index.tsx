import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { BrandMark, DemoBadge, Wordmark } from "@/components/parallax/Brand";
import { EvidencePanel } from "@/components/parallax/EvidencePanel";
import { TOPICS, themeOf } from "@/data/catalog";
import { RECORDS } from "@/data/records";
import { useStore } from "@/lib/store";
import { emptyFilters, type TopicId } from "@/lib/types";
import { useHydrated } from "@/lib/useHydrated";

const StoryGraph = lazy(() => import("@/components/parallax/StoryGraph").then((m) => ({ default: m.StoryGraph })));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PARALLAX — The internet is talking. Find the story." },
      { name: "description", content: "Explore video conversations, connect perspectives, and turn scattered evidence into your next investigation." },
      { property: "og:title", content: "PARALLAX — The internet is talking. Find the story." },
      { property: "og:description", content: "Explore video conversations, connect perspectives, and turn scattered evidence into your next investigation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function HeroMap() {
  // Static composition drawn from real housing themes in the dataset.
  const housing = RECORDS.filter((r) => r.topic === "housing");
  const themes = [...new Set(housing.flatMap((r) => r.themes))];
  const cx = 260, cy = 230;
  return (
    <svg viewBox="0 0 520 460" className="h-full w-full" role="img" aria-label="Relationship map linking the housing question to its themes in the demonstration data">
      {themes.map((t, i) => {
        const a = (i / themes.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * 165, y = cy + Math.sin(a) * 160;
        const recs = housing.filter((r) => r.themes.includes(t));
        return (
          <g key={t} className="fade-up" style={{ animationDelay: `${200 + i * 120}ms` }}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />
            {recs.map((r, j) => {
              const b = a + (j - (recs.length - 1) / 2) * 0.22;
              const vx = cx + Math.cos(b) * 228, vy = cy + Math.sin(b) * 210;
              return (
                <g key={r.id}>
                  <line x1={x} y1={y} x2={vx} y2={vy} stroke="var(--border)" />
                  <rect x={vx - 4} y={vy - 4} width="8" height="8" fill="var(--background)" stroke="var(--muted-foreground)" />
                </g>
              );
            })}
            <rect x={x - 62} y={y - 14} width="124" height="28" fill="var(--card)" stroke="var(--signal)" />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fill="var(--foreground)">{themeOf(t).label}</text>
          </g>
        );
      })}
      <g className="fade-up">
        <rect x={cx - 78} y={cy - 26} width="156" height="52" fill="var(--foreground)" />
        <text x={cx} y={cy - 3} textAnchor="middle" fontSize="15" fill="var(--background)" fontFamily="var(--font-serif)">Students &amp; housing</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="var(--background)">{housing.length} demo records</text>
      </g>
    </svg>
  );
}

function Landing() {
  const { runSearch, setFilters, saved, openRecord } = useStore();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const [topic, setTopic] = useState<TopicId>("housing");
  const [sel, setSel] = useState<string | null>(null);
  const records = useMemo(() => RECORDS.filter((r) => r.topic === topic), [topic]);
  const t = TOPICS.find((x) => x.id === topic)!;

  const openWorkspace = (q?: string, to: "/app" | "/app/discover" | "/app/story-dna" = "/app") => {
    if (q) {
      setFilters(emptyFilters);
      runSearch(q);
    }
    navigate({ to });
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
        <Wordmark />
        <nav aria-label="Main" className="flex items-center gap-4 text-sm text-muted-foreground md:gap-8">
          <a href="#product" className="hidden hover:text-foreground sm:inline">Product</a>
          <a href="#story-dna" className="hidden hover:text-foreground sm:inline">Story DNA</a>
          <Link to="/app" className="rounded-sm border border-border px-3 py-1.5 text-foreground hover:border-foreground/40">Workspace</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-10 md:px-10 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div className="fade-up">
          <p className="eyebrow">Find the story between the stories</p>
          <h1 className="mt-5 font-display text-5xl leading-[0.98] sm:text-6xl lg:text-[5.5rem]">
            The internet is talking. <em className="text-primary">Find the story.</em>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Explore video conversations, connect perspectives, and turn scattered evidence into your next investigation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => openWorkspace()} className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">
              Open workspace <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => openWorkspace(TOPICS[0].question, "/app/story-dna")} className="rounded-sm border border-border px-5 py-3 text-sm hover:border-foreground/40">
              Explore Story DNA
            </button>
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><DemoBadge /> This prototype runs on 45 fictional records. No live video analysis.</p>
        </div>
        <div className="aspect-[520/460] w-full border border-border bg-card/40">
          <HeroMap />
        </div>
      </section>

      <section id="story-dna" className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Live preview · demonstration data</p>
              <h2 className="mt-3 max-w-xl font-display text-4xl leading-tight md:text-5xl">Story DNA maps who is saying what — and why it connects.</h2>
            </div>
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Preview topic">
              {TOPICS.map((x) => (
                <button key={x.id} role="tab" aria-selected={topic === x.id} type="button" onClick={() => { setTopic(x.id); setSel(null); }} className={`rounded-sm border px-3 py-1.5 text-xs ${topic === x.id ? "border-primary bg-primary/15" : "border-border text-muted-foreground"}`}>
                  {x.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-8 h-[460px] border border-border bg-background">
            {hydrated && (
              <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">Loading preview…</p>}>
                <StoryGraph
                  key={topic}
                  question={t.question}
                  records={records}
                  selectedId={sel}
                  savedIds={saved}
                  onSelect={(id, kind, ref) => { setSel(id); if (kind === "video") openRecord(ref); }}
                />
              </Suspense>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Click a record to inspect its evidence. Relationships come from the {records.length} fictional records on this topic.</span>
            <button type="button" onClick={() => openWorkspace(t.question, "/app/discover")} className="text-primary hover:underline">Investigate this question →</button>
          </div>
        </div>
      </section>

      <section id="product" className="mx-auto max-w-7xl px-5 py-20 md:px-10">
        <div className="grid gap-px border border-border bg-border md:grid-cols-3">
          {[
            ["01", "Discover", "Ask in plain language. Search titles, transcripts, on-screen text, themes and perspectives across platforms."],
            ["02", "Connect", "See how themes and viewpoints link across videos, and spot the voices missing from the conversation."],
            ["03", "Verify", "Inspect timestamped excerpts, save evidence, and assemble a brief that flags what still needs checking."],
          ].map(([n, h, p]) => (
            <div key={h} className="bg-background p-8">
              <span className="font-mono text-xs text-primary">{n}</span>
              <h3 className="mt-6 font-display text-4xl">{h}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 border border-insight/30 bg-insight/5 p-8 md:grid-cols-[auto_1fr]">
          <BrandMark className="h-10 w-10" />
          <div>
            <h2 className="font-display text-3xl">About the demonstration data</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Every record in this prototype is fictional: creator labels are generic, quotes and figures are invented, and there are no
              source links or footage. Counts describe the demo dataset, not public opinion. Live video retrieval will be connected later
              through a dedicated data adapter.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-xs text-muted-foreground md:px-10">
          <Wordmark />
          <span>Find the story between the stories.</span>
          <Link to="/app" className="text-foreground hover:text-primary">Open workspace →</Link>
        </div>
      </footer>
      <EvidencePanel />
    </div>
  );
}
