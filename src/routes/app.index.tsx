import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { TOPICS } from "@/data/catalog";
import { RECORDS } from "@/data/records";
import { SearchBar } from "@/components/parallax/SearchBar";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { emptyFilters } from "@/lib/types";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [
    { title: "Research desk | PARALLAX" },
    { name: "description", content: "Start a research question or return to your saved fictional evidence in PARALLAX." },
    { property: "og:title", content: "Research desk | PARALLAX" },
    { property: "og:description", content: "Start a research question or return to your saved fictional evidence in PARALLAX." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Overview,
});
function Overview() {
  const { runSearch, setFilters, recent, saved } = useStore();
  const navigate = useNavigate();
  const go = (q: string) => { setFilters(emptyFilters); runSearch(q); navigate({ to: "/app/discover" }); };
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground pb-4"><p className="eyebrow">PARALLAX / Research desk</p><span className="text-xs text-muted-foreground">Fictional demonstration collection</span></div>
      <h1 className="mt-8 font-display text-4xl md:text-5xl">Start with a question.</h1>
      <div className="mt-6 max-w-3xl"><SearchBar navigateTo="/app/discover" /></div>
      <div className="mt-12 grid gap-12 lg:grid-cols-[2fr_1fr]">
        <section><h2 className="eyebrow mb-4">Example investigations</h2><div className="divide-y divide-border border-y border-border">{TOPICS.map((t, i) => <div key={t.id} className="grid grid-cols-[30px_1fr] gap-4 py-5"><span className="pt-1 font-mono text-xs text-muted-foreground">0{i+1}</span><div><Button variant="editorial" onClick={() => go(t.question)} className="block font-display text-2xl leading-snug">{t.question}</Button><p className="mt-2 text-xs text-muted-foreground">{t.label} · {RECORDS.filter((r) => r.topic === t.id).length} fictional records</p></div></div>)}</div></section>
        <aside className="space-y-10"><section><h2 className="eyebrow mb-4">Your evidence collection</h2><p className="font-display text-3xl">{saved.length} saved records</p><div className="mt-4 flex flex-col items-start gap-3 text-sm"><Link to="/app/saved" className="underline">Review saved evidence</Link><Link to="/app/brief" className="underline">Open editorial brief</Link></div></section><section className="border-t border-border pt-5"><h2 className="eyebrow mb-4">Recent investigations</h2>{recent.length === 0 ? <p className="text-sm text-muted-foreground">No recent searches in this browser.</p> : <ul className="divide-y divide-border">{recent.map((r) => <li key={r.query} className="py-3"><Button variant="editorial" onClick={() => go(r.query)} className="text-sm leading-relaxed underline">{r.query}</Button></li>)}</ul>}</section><p className="border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">45 fictional records across five topics. Quotes and figures are invented. Searches and saved evidence stay in this browser.</p></aside>
      </div>
    </div>
  );
}
