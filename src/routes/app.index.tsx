import { useSearchProvider } from "@/lib/provider-context";
import { ArrowUpRight } from "lucide-react";
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
      <p className="border-b border-border pb-5 text-right text-xs text-muted-foreground">
        {live ? "Live sources · any topic, in French or English" : "Fictional collection · France"}
      </p>
      <div className="desk-intro">
        <div>
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
            <strong className="inline-flex items-center gap-1">View collection <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></strong>
          </div>
        </Link>
      </div>
      <div className="desk-search">
        <SearchBar navigateTo="/app/discover" />
      </div>
      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Pick up a thread</h2>
          <span className="text-xs text-muted-foreground">
            {live
              ? "A few starting points."
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
              <h3>
                A place to live.
                <br />A price to pay.
              </h3>
              <p>
                {live
                  ? "The original housing case. Start here, or ask about any topic below."
                  : "Rent, guarantors, and the search for a room."}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {live ? "Student housing · start a search" : "Student housing · 9 demo records"}
              </p>
              <span className="mt-6 inline-flex items-center gap-1 text-xs font-bold">Open investigation <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></span>
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
                    <h3>{t.label}</h3>
                    <p>{t.question}</p>
                  </div>
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-primary" />
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
                  <h3>{t.label}</h3>
                  <p>{t.question}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-mono">{RECORDS.filter((r) => r.topic === t.id).length}</span>{" "}
                    demo records
                  </p>
                </div>
                <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-primary" />
              </button>
            ))}
          </div>
        </div>
      </section>
      <div className="mt-10 grid gap-9 border-t border-border pt-7 md:grid-cols-[1.5fr_1fr]">
        <section>
          <h2 className="mb-4 text-sm font-semibold">Recent investigations</h2>
          {recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Your next investigation starts above. Recent searches will appear here.
            </p>
          ) : (
            <ul className="space-y-3">
              {recent.map((r) => (
                <li key={r.query}>
                  <Button variant="editorial" onClick={() => go(r.query)} className="text-sm">
                    {r.query} <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-md border border-border bg-card p-5">
          <h2 className="text-xl font-bold tracking-tight">Turn evidence into direction.</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Your saved passages become the foundation for an editorial brief.
          </p>
          <Link
            to="/app/brief"
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary"
          >
            Open editorial brief <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </section>
      </div>
    </div>
  );
}
