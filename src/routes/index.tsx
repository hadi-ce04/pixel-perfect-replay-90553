import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { DemoBadge, Wordmark } from "@/components/parallax/Brand";
import { Button } from "@/components/ui/button";
import { EvidencePanel } from "@/components/parallax/EvidencePanel";
import { SaveButton } from "@/components/parallax/SaveButton";
import { TOPICS } from "@/data/catalog";
import { RECORDS } from "@/data/records";
import { useStore } from "@/lib/store";
import { emptyFilters, type TopicId } from "@/lib/types";
import { useHydrated } from "@/lib/useHydrated";
import { formatTime } from "@/lib/format";

const StoryGraph = lazy(() => import("@/components/parallax/StoryGraph").then((m) => ({ default: m.StoryGraph })));
const description = "Search video conversations, trace different perspectives, and assemble an editorial brief from the evidence you select.";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "PARALLAX: research across social video" },
    { name: "description", content: description },
    { property: "og:title", content: "PARALLAX: research across social video" },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Landing,
});

function Landing() {
  const { runSearch, setFilters, saved, openRecord } = useStore();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const [topic, setTopic] = useState<TopicId>("housing");
  const [selected, setSelected] = useState<string | null>(null);
  const currentTopic = TOPICS.find((t) => t.id === topic) ?? TOPICS[0];
  const records = useMemo(() => RECORDS.filter((r) => r.topic === topic), [topic]);
  const [question, setQuestion] = useState(TOPICS[0]?.question ?? "");
  const investigate = (q: string, to: "/app/discover" | "/app/story-dna" = "/app/discover") => {
    setFilters(emptyFilters); runSearch(q); navigate({ to });
  };
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-[1400px] items-center justify-between border-b border-foreground px-5 py-5 md:px-10">
        <Wordmark />
        <nav aria-label="Main" className="flex items-center gap-6 text-sm">
          <a href="#investigation" className="hidden underline sm:block">Example investigation</a>
          <Button asChild variant="outline" size="sm"><Link to="/app">Open workspace</Link></Button>
        </nav>
      </header>
      <main>
        <section className="mx-auto grid max-w-[1400px] gap-10 px-5 pb-12 pt-10 md:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:pb-14 lg:pt-16">
          <div>
            <p className="eyebrow">Research across social video</p>
            <h1 className="mt-6 max-w-lg font-display text-5xl leading-[1.06] md:text-6xl">Find the story<br className="hidden md:block" /> between the stories.</h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">{description}</p>
            <Button asChild className="mt-8" size="lg"><Link to="/app">Open workspace</Link></Button>
            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground"><DemoBadge /><span>45 fictional records. No live video retrieval.</span></div>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-y border-border py-3">
              <p className="eyebrow">Research diagram / 01</p>
              <span className="text-xs text-muted-foreground">Student housing · fictional records</span>
            </div>
            <div className="h-[300px] md:h-[350px] lg:h-[390px]">
              {hydrated && <Suspense fallback={<p className="p-6 text-sm">Loading diagram…</p>}><StoryGraph question={TOPICS[0]?.question ?? "Student housing"} records={RECORDS.filter((r) => r.topic === "housing")} selectedId={selected} savedIds={saved} onSelect={(id, kind, ref) => { setSelected(id); if (kind === "video") openRecord(ref); }} /></Suspense>}
            </div>
            <Button variant="editorial" onClick={() => investigate(TOPICS[0]?.question ?? "housing", "/app/story-dna")} className="mt-3 text-sm underline">Open this investigation</Button>
          </div>
        </section>

        <section id="investigation" className="border-y border-foreground">
          <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-10 md:px-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div><p className="eyebrow">01 / Begin the investigation</p><h2 className="mt-3 font-display text-3xl">Ask a research question.</h2><p className="mt-3 text-sm text-muted-foreground">Search the titles, passages and themes in the demonstration collection.</p></div>
            <div>
              <form role="search" onSubmit={(e) => { e.preventDefault(); investigate(question); }} className="flex flex-col gap-3 sm:flex-row">
                <label htmlFor="example-question" className="sr-only">Example research question</label>
                <input id="example-question" value={question} onChange={(e) => setQuestion(e.target.value)} className="min-w-0 flex-1 border border-input bg-card px-4 py-3 text-base outline-none focus:border-primary" />
                <Button type="submit" className="h-auto px-6 py-3">Investigate</Button>
              </form>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">{TOPICS.map((t) => <Button key={t.id} variant="editorial" onClick={() => setQuestion(t.question)} className="text-xs underline">{t.label}</Button>)}</div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1400px] px-5 py-12 md:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div><p className="eyebrow">02 / Follow the connections</p><h2 className="mt-3 font-display text-3xl">Explore the connected themes.</h2><p className="mt-3 text-sm text-muted-foreground">The same question can lead to different accounts. Story DNA connects the themes and perspectives recorded in each source.</p></div>
            <div className="min-w-0">
              <div role="tablist" aria-label="Preview topic" className="flex flex-wrap gap-x-5 gap-y-2 border-b border-border pb-3">{TOPICS.map((t) => <Button variant="editorial" key={t.id} role="tab" aria-selected={topic === t.id} onClick={() => { setTopic(t.id); setSelected(null); }} className={`border-b-2 pb-1 text-sm ${topic === t.id ? "border-primary font-semibold text-primary" : "border-transparent text-muted-foreground"}`}>{t.label}</Button>)}</div>
              <div className="h-[320px] md:h-[420px]">{hydrated && <Suspense fallback={<p className="p-6 text-sm">Loading diagram…</p>}><StoryGraph key={topic} question={currentTopic?.question ?? ""} records={records} selectedId={selected} savedIds={saved} onSelect={(id, kind, ref) => { setSelected(id); if (kind === "video") openRecord(ref); }} /></Suspense>}</div>
              <p className="mt-3 text-xs text-muted-foreground">{records.length} fictional records on this topic. Connections describe record fields, not causality.</p>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-12 md:px-10 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
            <div><p className="eyebrow">03 / Read the source</p><h2 className="mt-3 font-display text-3xl">Inspect the supporting evidence.</h2><div className="mt-6 divide-y divide-border border-t border-border">{records.slice(0, 2).map((r) => <article key={r.id} className="py-5"><p className="text-xs text-muted-foreground">{r.id} · {r.platform} · Fictional record</p><h3 className="mt-2 font-display text-2xl">{r.title}</h3>{r.evidence[0] && <blockquote className="mt-3 font-display text-xl leading-relaxed"><span className="mr-3 font-sans text-xs text-primary">{formatTime(r.evidence[0].startSeconds)}</span>{r.evidence[0].excerpt}</blockquote>}<div className="mt-4 flex items-center gap-5"><Button variant="editorial" className="text-xs underline" onClick={() => openRecord(r.id)}>Open evidence</Button><SaveButton id={r.id} /></div></article>)}</div></div>
            <div className="lg:border-l lg:border-border lg:pl-10"><p className="eyebrow">04 / Write from the evidence</p><h2 className="mt-3 font-display text-3xl">Assemble the brief.</h2><p className="mt-4 max-w-sm font-display text-xl leading-relaxed">The brief brings together your selected passages, shared themes and contrasting perspectives, with references back to each record.</p><p className="mt-4 text-sm text-muted-foreground">Questions requiring independent verification remain separate from the evidence.</p><dl className="mt-8 border-y border-border py-4"><div className="flex justify-between text-sm"><dt>Your saved evidence</dt><dd className="font-semibold">{saved.length} records</dd></div></dl><Button asChild variant="outline" className="mt-6"><Link to="/app/brief">Open editorial brief</Link></Button></div>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-[1400px] flex-wrap items-start justify-between gap-6 px-5 py-8 md:px-10"><Wordmark /><p className="max-w-md text-xs leading-relaxed text-muted-foreground">All records, quotes and figures are fictional. No source footage is available. Demonstration briefs must not be cited as reporting.</p><Link to="/app" className="text-sm underline">Open workspace</Link></footer>
      <EvidencePanel />
    </div>
  );
}
