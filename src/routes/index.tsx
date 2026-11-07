import { SearchProviderBoundary } from "@/lib/provider-context";
import { mockProvider } from "@/lib/provider";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { DemoBadge, Wordmark } from "@/components/parallax/Brand";
import { Button } from "@/components/ui/button";
import { EvidencePanel } from "@/components/parallax/EvidencePanel";
import { TopicArt } from "@/components/parallax/TopicArt";
import { SaveButton } from "@/components/parallax/SaveButton";
import { TOPICS } from "@/data/catalog";
import { RECORDS } from "@/data/records";
import { useStore } from "@/lib/store";
import { emptyFilters, type TopicId } from "@/lib/types";
import { useHydrated } from "@/lib/useHydrated";
import { formatTime } from "@/lib/format";
import editorialHousing from "@/assets/editorial-housing.jpg";

const StoryGraph = lazy(() =>
  import("@/components/parallax/StoryGraph").then((m) => ({ default: m.StoryGraph })),
);
const description =
  "Explore video conversations, connect perspectives, and build a story from the evidence.";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PARALLAX | Look closer. Find the story." },
      { name: "description", content: description },
      { property: "og:title", content: "PARALLAX | Look closer. Find the story." },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SearchProviderBoundary source={mockProvider}>
      <Landing />
    </SearchProviderBoundary>
  ),
});

function Landing() {
  const { runSearch, setFilters, saved, openRecord } = useStore();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const [topic, setTopic] = useState<TopicId>("housing");
  const [selected, setSelected] = useState<string | null>(null);
  const currentTopic = TOPICS.find((t) => t.id === topic)!;
  const records = useMemo(() => RECORDS.filter((r) => r.topic === topic), [topic]);
  const firstRecord = records[0] ?? RECORDS[0]!;
  const firstEvidence = firstRecord.evidence[0]!;
  const [question, setQuestion] = useState(TOPICS[0]!.question);
  const investigate = (q: string, to: "/app/discover" | "/app/story-dna" = "/app/discover") => {
    setFilters(emptyFilters);
    runSearch(q);
    navigate({ to });
  };
  return (
    <div className="landing">
      <header className="landing-nav">
        <Wordmark />
        <nav aria-label="Main" className="flex items-center gap-7 text-xs font-semibold">
          <a
            href="#story-dna"
            className="hidden text-muted-foreground hover:text-foreground sm:block"
          >
            The product
          </a>
          <a
            href="#investigation"
            className="hidden text-muted-foreground hover:text-foreground md:block"
          >
            Explore a story
          </a>
          <Button asChild variant="outline" className="rounded-full text-xs">
            <Link to="/app">
              Enter workspace <span aria-hidden="true">↗</span>
            </Link>
          </Button>
        </nav>
      </header>
      <main>
        <section className="landing-hero">
          <img src={editorialHousing} alt="" className="hero-illustration" width={1600} height={1008} fetchPriority="high" />
          <div className="hero-copy">
            <p className="eyebrow flex items-center gap-3">
              <span className="h-1.5 w-1.5 bg-primary" />A new lens on social video
            </p>
            <h1>PARALLAX / The research journal</h1>
            <p className="hero-headline">
              Look closer.<br />
              Find the <em>story.</em>
            </p>
            <p className="hero-description">
              The most interesting story is rarely in one video. Connect the conversations. Follow
              the evidence. Find your angle.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Button asChild size="lg" className="h-12 rounded-full px-7 font-bold">
                <Link to="/app">
                  Start investigating <span aria-hidden="true">↗</span>
                </Link>
              </Button>
              <a href="#story-dna" className="text-xs font-semibold underline underline-offset-4">
                Explore Story DNA
              </a>
            </div>
            <div className="hero-demo">
              <DemoBadge />
              <span>
                Explore 45 fictional video records.
                <br />
                Live retrieval comes later.
              </span>
            </div>
          </div>
          <span className="hero-art-caption">Editorial illustration · not source footage</span>
        </section>
        <div className="product-strip">
          <span>
            Built for curious minds.
            <br />
            <strong>Designed for the newsroom.</strong>
          </span>
          <p>Discover conversations.</p>
          <span className="strip-divider" />
          <p>Connect perspectives.</p>
          <span className="strip-divider" />
          <p>Trace every insight.</p>
        </div>

        <section id="investigation" className="investigation-section">
          <div>
            <p className="eyebrow text-primary">01 / Your starting point</p>
            <h2>
              A good story starts
              <br />
              with a better question.
            </h2>
          </div>
          <div className="investigation-search">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                investigate(question);
              }}
            >
              <label htmlFor="example-question" className="sr-only">
                Example research question
              </label>
              <input
                id="example-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <Button type="submit" size="icon" aria-label="Investigate this question">
                ↗
              </Button>
            </form>
            <div className="flex flex-wrap gap-2 pt-4">
              {TOPICS.map((t) => (
                <Button
                  variant="editorial"
                  type="button"
                  key={t.id}
                  onClick={() => setQuestion(t.question)}
                  className={`topic-pill ${question === t.question ? "is-active" : ""}`}
                >
                  {t.label}
                </Button>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-muted-foreground">
              Search the demonstration collection. No account required.
            </p>
          </div>
        </section>

        <section id="story-dna" className="dna-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow text-primary">02 / The bigger picture</p>
              <h2>
                Separate videos.
                <br />
                <span className="text-muted-foreground">Connected stories.</span>
              </h2>
            </div>
            <div className="max-w-xs">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Story DNA maps the themes and viewpoints inside your investigation. Pick a
                connection to explore its evidence.
              </p>
              <Button
                variant="editorial"
                onClick={() => investigate(currentTopic.question, "/app/story-dna")}
                className="mt-5 text-xs font-bold text-primary"
              >
                Open full investigation ↗
              </Button>
            </div>
          </div>
          <div className="dna-window">
            <div className="dna-toolbar">
              <div className="flex items-center gap-2">
                <span className="stage-dot" />
                <strong>Story DNA</strong>
                <span className="hidden text-muted-foreground sm:inline">
                  / {currentTopic.label}
                </span>
              </div>
              <span className="text-muted-foreground">{records.length} demo records</span>
            </div>
            <div role="tablist" aria-label="Preview topic" className="dna-tabs">
              {TOPICS.map((t) => (
                <Button
                  variant="editorial"
                  type="button"
                  role="tab"
                  aria-selected={topic === t.id}
                  key={t.id}
                  onClick={() => {
                    setTopic(t.id);
                    setSelected(null);
                  }}
                  className={topic === t.id ? "is-active" : ""}
                >
                  {t.label}
                </Button>
              ))}
            </div>
            <div className="dna-canvas">
              {hydrated && (
                <Suspense fallback={<p className="p-6 text-sm">Loading diagram…</p>}>
                  <StoryGraph
                    key={topic}
                    question={currentTopic.question}
                    records={records}
                    selectedId={selected}
                    savedIds={saved}
                    onSelect={(id, kind, ref) => {
                      setSelected(id);
                      if (kind === "video") openRecord(ref);
                    }}
                  />
                </Suspense>
              )}
            </div>
            <div className="dna-footer">
              <span>
                <i className="legend-square" />
                Theme <i className="legend-ring" />
                Perspective
              </span>
              <span>Connections come from fictional record fields.</span>
            </div>
          </div>
        </section>

        <section className="evidence-section">
          <div className="evidence-copy">
            <p className="eyebrow">03 / Keep the receipts</p>
            <h2>
              An insight is only
              <br />
              as strong as
              <br />
              its evidence.
            </h2>
            <p>
              Go straight to the passage behind a theme. Inspect the context, collect what matters,
              and keep every reference within reach.
            </p>
            <Button type="button" onClick={() => openRecord(firstRecord.id)} className="ink-button">
              Inspect a record <span>↗</span>
            </Button>
            <span className="evidence-disclaimer">Fictional example. No source footage.</span>
          </div>
          <div className="evidence-specimen">
            <div className="specimen-top">
              <span>EVIDENCE / {firstRecord.id}</span>
              <span>{firstRecord.platform}</span>
            </div>
            <div className="specimen-art">
              <TopicArt topic={topic} className="h-full w-full" />
              <span>ILLUSTRATION</span>
            </div>
            <div className="specimen-quote">
              <span>
                {formatTime(firstEvidence.startSeconds)} · {firstEvidence.modality}
              </span>
              <blockquote>{firstEvidence.excerpt}</blockquote>
              <SaveButton id={firstRecord.id} />
            </div>
          </div>
        </section>

        <section className="brief-section">
          <div>
            <p className="eyebrow text-primary">04 / From research to direction</p>
            <h2>
              You found the evidence.
              <br />
              Now find your angle.
            </h2>
            <p>
              Your saved records become a structured brief with themes, perspectives, and
              references. You decide where the story goes next.
            </p>
            <Button asChild size="lg" className="mt-7 rounded-full">
              <Link to="/app/brief">Open editorial brief ↗</Link>
            </Button>
          </div>
          <div className="brief-sheet">
            <div className="brief-sheet-top">
              PARALLAX / EDITORIAL BRIEF<span>RESEARCH COPY</span>
            </div>
            <h3>
              The student
              <br />
              housing question.
            </h3>
            <p className="brief-sheet-caption">Illustrative report structure</p>
            <div className="brief-sheet-row">
              <span>01</span>
              <strong>Observed themes</strong>
              <small>Linked to selected records</small>
            </div>
            <div className="brief-sheet-row">
              <span>02</span>
              <strong>Different perspectives</strong>
              <small>Compare what sources express</small>
            </div>
            <div className="brief-sheet-row">
              <span>03</span>
              <strong>Questions to verify</strong>
              <small>Keep uncertainty in view</small>
            </div>
            <div className="brief-sheet-bottom">
              {saved.length} records in your evidence collection
            </div>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <Wordmark />
        <p>
          Independent thinking.
          <br />
          Connected evidence.
        </p>
        <span>
          Prototype / All records are fictional.
          <br />
          No live retrieval is connected.
        </span>
        <Link to="/app" className="text-xs font-semibold">
          Open workspace ↗
        </Link>
      </footer>
      <EvidencePanel />
    </div>
  );
}
