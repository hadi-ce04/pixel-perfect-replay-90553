import { SearchProviderBoundary } from "@/lib/provider-context";
import { mockProvider } from "@/lib/provider";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { DemoBadge, ThemeToggle, Wordmark } from "@/components/parallax/Brand";
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
          <ThemeToggle className="hidden sm:inline-flex" />
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
              Enter workspace <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </nav>
      </header>
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <h1 className="hero-headline">
              Look closer.
              <br />
              Find the <em>story.</em>
            </h1>
            <p className="hero-description">
              The story is rarely in one video. Search what people say on camera, keep the exact
              words and timestamps, and put two accounts side by side.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <Button asChild size="lg" className="h-12 px-7 font-bold">
                <Link to="/app">
                  Start investigating <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </Button>
              <a href="#story-dna" className="hero-link">
                See Story DNA
              </a>
            </div>
            <div className="hero-demo">
              <DemoBadge />
              <span>Examples on this page are fictional. The workspace searches real sources.</span>
            </div>
          </div>
          <ContactSheet />
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
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
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
                Open full investigation <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
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
              Inspect a record <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
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
              <Link to="/app/brief">
                Open editorial brief <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
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
          Examples on this page are fictional.
          <br />
          The workspace connects to live sources.
        </span>
        <Link to="/app" className="inline-flex items-center gap-1 text-xs font-semibold">
          Open workspace <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </footer>
      <EvidencePanel />
    </div>
  );
}

/** Landing-only contact sheet built from fictional demo records: two frames marked as a pair. */
const SHEET_IDS = ["HOU-001", "GRO-002", "HOU-002", "TRA-001", "EMP-003", "CLI-002", "HOU-008", "GRO-004", "TRA-005", "EMP-001", "CLI-004", "HOU-006"];
const PAIR = ["HOU-002", "HOU-008"];

function ContactSheet() {
  const frames = SHEET_IDS.map((id) => RECORDS.find((r) => r.id === id)).filter(
    (r): r is (typeof RECORDS)[number] => !!r,
  );
  return (
    <figure className="contact-sheet" aria-label="Illustrated contact sheet of fictional records">
      <div className="sheet-rail" aria-hidden="true" />
      <div className="sheet-grid">
        {frames.map((r, i) => {
          const mark = PAIR.indexOf(r.id);
          const ev = r.evidence[0];
          return (
            <div key={r.id} className={`sheet-frame ${mark >= 0 ? "is-marked" : ""}`}>
              <div className="sheet-print">
                <TopicArt topic={r.topic === "unclassified" ? "housing" : r.topic} className="h-full w-full" />
              </div>
              <span className="sheet-num">{String(i + 1).padStart(2, "0")}A</span>
              <span className="sheet-time">{formatTime(ev?.startSeconds ?? null)}</span>
              {mark >= 0 && (
                <>
                  <svg className="sheet-circle" viewBox="0 0 120 100" aria-hidden="true">
                    <path d="M62 6C30 4 6 22 7 50c1 27 26 44 57 43 31-1 51-21 50-46C113 22 92 5 58 9" />
                  </svg>
                  <span className="sheet-letter">{mark === 0 ? "A" : "B"}</span>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="sheet-rail" aria-hidden="true" />
      <figcaption>
        <span className="text-primary">A ↔ B</span> Same theme, two accounts. That's a Story Tension.
        <em>Illustration · fictional records</em>
      </figcaption>
    </figure>
  );
}
