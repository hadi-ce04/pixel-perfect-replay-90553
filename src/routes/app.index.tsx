import { useSearchProvider } from "@/lib/provider-context";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { TOPICS } from "@/data/catalog";
import { RECORDS } from "@/data/records";
import { TopicArt } from "@/components/parallax/TopicArt";
import { SearchBar } from "@/components/parallax/SearchBar";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { emptyFilters } from "@/lib/types";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Research desk | PARALLAX" },
      {
        name: "description",
        content: "Start an investigation on any topic.",
      },
      { property: "og:title", content: "Research desk | PARALLAX" },
      { property: "og:description", content: "Start an investigation on any topic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});
/** Open-ended starting points for live research. Any question works; these only show the range. */
const LIVE_QUESTIONS = [
  { label: "Elections", question: "Que disent les électeurs sur les élections municipales ?" },
  { label: "Sport", question: "How are fans reacting to Mbappé at Real Madrid?" },
  { label: "Technology", question: "What are students saying about ChatGPT at school?" },
  { label: "Named entity", question: "Emmanuel Macron et la réforme des retraites" },
];

function Overview() {
  const live = useSearchProvider().mode === "live";
  const { runSearch, setFilters, recent, saved } = useStore();
  const navigate = useNavigate();
  const go = (q: string) => {
    setFilters(emptyFilters);
    runSearch(q);
    navigate({ to: "/app/discover" });
  };
  return (
    <div className="research-desk mx-auto max-w-7xl px-5 py-9 md:px-10 md:py-12">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <p className="eyebrow">The research desk</p>
        <span className="text-[10px] font-semibold text-muted-foreground">
          {live ? "LIVE SOURCES / ANY TOPIC" : "COLLECTION 001 / FRANCE"}
        </span>
      </div>
      <div className="desk-intro">
        <div>
          <p className="eyebrow text-primary">Follow your curiosity.</p>
          <h1>What's the story?</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            A question, a conversation, a connection worth chasing.
          </p>
        </div>
        <Link to="/app/saved" className="desk-saved">
          <span>{saved.length.toString().padStart(2, "0")}</span>
          <div>
            Saved evidence
            <br />
            <strong>View collection ↗</strong>
          </div>
        </Link>
      </div>
      <div className="desk-search">
        <SearchBar navigateTo="/app/discover" />
      </div>
      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="eyebrow">Pick up a thread</h2>
          <span className="text-[10px] text-muted-foreground">
            {live
              ? "Any topic, in French or English. A few starting points."
              : "Five topics. 45 fictional records."}
          </span>
        </div>
        <div className="desk-investigations">
          <button type="button" onClick={() => go(TOPICS[0]!.question)} className="desk-lead">
            <div className="desk-lead-art">
              <TopicArt topic="housing" className="h-full w-full" />
              <span>ILLUSTRATED INVESTIGATION</span>
            </div>
            <div className="desk-lead-body">
              <p className="eyebrow text-primary">
                {live ? "Student housing / Start a search" : "Student housing / 09 demo records"}
              </p>
              <h3>
                A place to live.
                <br />A price to pay.
              </h3>
              <p>
                {live
                  ? "The original housing case. Start here, or ask about any topic below."
                  : "Rent, guarantors, and the search for a room."}
              </p>
              <span className="mt-6 block text-xs font-bold">Open investigation ↗</span>
            </div>
          </button>
          <div className="desk-topics">
            {live &&
              LIVE_QUESTIONS.map((t, i) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => go(t.question)}
                  className="desk-topic"
                >
                  <div className="desk-topic-art">
                    <TopicArt topic="open" tone={i} className="h-full w-full" />
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      0{i + 2} / Example research question
                    </span>
                    <h3>{t.label}</h3>
                    <p>{t.question}</p>
                  </div>
                  <span aria-hidden="true" className="text-primary">
                    ↗
                  </span>
                </button>
              ))}
            {!live && TOPICS.slice(1).map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => go(t.question)}
                className="desk-topic"
              >
                <div className="desk-topic-art">
                  <TopicArt topic={t.id} className="h-full w-full" />
                </div>
                <div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    0{i + 2} / {RECORDS.filter((r) => r.topic === t.id).length} demo records
                  </span>
                  <h3>{t.label}</h3>
                  <p>{t.question}</p>
                </div>
                <span aria-hidden="true" className="text-primary">
                  ↗
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className="mt-10 grid gap-9 border-t border-border pt-7 md:grid-cols-[1.5fr_1fr]">
        <section>
          <h2 className="eyebrow mb-4">Recent investigations</h2>
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Your next investigation starts above. Recent searches will appear here.
            </p>
          ) : (
            <ul className="space-y-3">
              {recent.map((r) => (
                <li key={r.query}>
                  <Button variant="editorial" onClick={() => go(r.query)} className="text-sm">
                    {r.query} ↗
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-md border border-border bg-card p-5">
          <p className="eyebrow text-primary">The next step</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight">Turn evidence into direction.</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Your saved passages become the foundation for an editorial brief.
          </p>
          <Link to="/app/brief" className="mt-4 inline-block text-xs font-bold text-primary">
            Open editorial brief ↗
          </Link>
        </section>
      </div>
    </div>
  );
}
