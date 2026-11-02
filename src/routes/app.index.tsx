import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Clock } from "lucide-react";
import { lazy, Suspense, useMemo } from "react";
import { PERSPECTIVES, THEMES, TOPICS } from "@/data/catalog";
import { RECORDS } from "@/data/records";
import { SearchBar } from "@/components/parallax/SearchBar";
import { useStore } from "@/lib/store";
import { emptyFilters } from "@/lib/types";
import { useHydrated } from "@/lib/useHydrated";

const StoryGraph = lazy(() => import("@/components/parallax/StoryGraph").then((m) => ({ default: m.StoryGraph })));

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Overview — PARALLAX workspace" },
      { name: "description", content: "Start an investigation across the PARALLAX demonstration dataset." },
      { property: "og:title", content: "Overview — PARALLAX workspace" },
      { property: "og:description", content: "Start an investigation across the PARALLAX demonstration dataset." },
    ],
  }),
  component: Overview,
});

const FEATURED = [
  { topic: "housing", kicker: "Lead investigation", text: "Rent, guarantors and residence waiting lists in students' own words." },
  { topic: "employment", kicker: "Labour", text: "Internship chains, the experience paradox and career pivots." },
  { topic: "climate", kicker: "Environment", text: "From eco-anxiety to the cost of sustainable choices." },
] as const;

function Overview() {
  const { runSearch, setFilters, recent, saved } = useStore();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const go = (q: string) => {
    setFilters(emptyFilters);
    runSearch(q);
    navigate({ to: "/app/discover" });
  };
  const housing = useMemo(() => RECORDS.filter((r) => r.topic === "housing"), []);
  const stats = [
    ["Records", RECORDS.length],
    ["Topics", TOPICS.length],
    ["Themes", THEMES.length],
    ["Perspectives", PERSPECTIVES.length],
    ["TikTok", RECORDS.filter((r) => r.platform === "TikTok").length],
    ["Instagram", RECORDS.filter((r) => r.platform === "Instagram").length],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-10 md:py-14">
      <p className="eyebrow">Workspace · Overview</p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] md:text-6xl">What story are you chasing today?</h1>
      <div className="mt-8 max-w-3xl">
        <SearchBar navigateTo="/app/discover" />
        <div className="mt-4 flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => go(t.question)}
              className="rounded-sm border border-border px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {t.question}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-14">
        <h2 className="eyebrow mb-4">Featured investigations</h2>
        <div className="grid gap-px border border-border bg-border md:grid-cols-3">
          {FEATURED.map((f) => {
            const t = TOPICS.find((x) => x.id === f.topic)!;
            const n = RECORDS.filter((r) => r.topic === f.topic).length;
            return (
              <button key={f.topic} type="button" onClick={() => go(t.question)} className="group bg-card p-6 text-left transition-colors hover:bg-secondary">
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-primary">{f.kicker}</span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <h3 className="mt-4 font-display text-2xl leading-tight">{t.label}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
                <p className="mt-4 font-mono text-xs text-muted-foreground">{n} demonstration records</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="eyebrow">Story DNA preview · Student housing</h2>
            <Link to="/app/story-dna" onClick={() => go(TOPICS[0].question)} className="text-xs text-primary hover:underline">
              Open full graph →
            </Link>
          </div>
          <div className="h-[340px] border border-border bg-card">
            {hydrated && (
              <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading graph…</div>}>
                <StoryGraph question="Student housing" records={housing} selectedId={null} savedIds={saved} interactive={false} />
              </Suspense>
            )}
          </div>
        </div>
        <div className="space-y-8">
          <div>
            <h2 className="eyebrow mb-1">Dataset coverage</h2>
            <p className="mb-4 text-xs text-muted-foreground">Counts describe the fictional demonstration dataset only — not public opinion or trends.</p>
            <dl className="grid grid-cols-3 gap-px border border-border bg-border">
              {stats.map(([k, v]) => (
                <div key={k} className="bg-card p-3">
                  <dd className="font-display text-3xl">{v}</dd>
                  <dt className="text-[11px] text-muted-foreground">{k}</dt>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="eyebrow mb-3">Recent investigations</h2>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Your searches will appear here. They are stored only in this browser.</p>
            ) : (
              <ul className="divide-y divide-border border-y border-border">
                {recent.map((r) => (
                  <li key={r.query}>
                    <button type="button" onClick={() => go(r.query)} className="flex w-full items-center gap-3 py-2.5 text-left text-sm hover:text-primary">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="line-clamp-1">{r.query}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
