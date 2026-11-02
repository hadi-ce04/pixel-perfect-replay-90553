import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";
import { briefToMarkdown, generateBrief } from "@/lib/brief";
import { recordById } from "@/lib/provider";
import { useStore } from "@/lib/store";
import { formatDate, formatTime } from "@/lib/format";

export const Route = createFileRoute("/app/brief")({
  head: () => ({
    meta: [
      { title: "Editorial brief — PARALLAX workspace" },
      { name: "description", content: "A deterministic brief generated from your saved demonstration evidence." },
      { property: "og:title", content: "Editorial brief — PARALLAX workspace" },
      { property: "og:description", content: "A deterministic brief generated from your saved demonstration evidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BriefPage,
});

function Ref({ id }: { id: string }) {
  const { openRecord } = useStore();
  return (
    <Button variant="editorial" type="button" onClick={() => openRecord(id)} className="font-mono text-xs text-primary hover:underline">
      {id}
    </Button>
  );
}

function BriefPage() {
  const { saved, query, hydrated } = useStore();
  const records = useMemo(() => saved.map(recordById).filter((r) => r !== null), [saved]);
  const brief = useMemo(() => generateBrief(query, records), [query, records]);
  const md = useMemo(() => briefToMarkdown(brief), [brief]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(md);
      toast.success("Brief copied to clipboard");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = md;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (ok) toast.success("Brief copied to clipboard");
      else toast.error("Clipboard unavailable — use Download instead");
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "parallax-demo-brief.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!hydrated) return null;
  if (records.length === 0)
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 text-center md:px-10">
        <p className="eyebrow">Workspace · Editorial brief</p>
        <h1 className="mt-3 font-display text-4xl">Your brief starts with evidence</h1>
        <p className="mt-3 text-sm text-muted-foreground">Save at least one record and PARALLAX will assemble a brief strictly from what you selected.</p>
        <Link to="/app/discover" className="mt-6 inline-block rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Find evidence</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">Workspace · Editorial brief</p>
        <div className="flex gap-2">
          <Button variant="editorial" type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs">Copy brief</Button>
          <Button variant="editorial" type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-1.5 text-xs">Download .md</Button>
        </div>
      </div>
      <div className="mt-6 border border-border bg-secondary p-3 text-xs">
        Demonstration brief based on fictional records. Not real sources and not representative of public opinion.
      </div>

      <article className="mt-8 space-y-10 border-t border-foreground pt-8">
        <header>
          <p className="eyebrow">Research question</p>
          <h1 className="mt-2 font-display text-4xl leading-tight md:text-5xl">{brief.question || "No research question set"}</h1>
        </header>

        <section>
          <h2 className="eyebrow mb-3">Source coverage</h2>
          <dl className="grid grid-cols-2 gap-4 border-y border-border py-4 sm:grid-cols-4">
            <div className="py-1"><dd className="text-lg font-semibold">{brief.recordCount}</dd><dt className="text-[11px] text-muted-foreground">Records included</dt></div>
            {Object.entries(brief.platforms).map(([k, v]) => (
              <div key={k} className="py-1"><dd className="text-lg font-semibold">{v}</dd><dt className="text-[11px] text-muted-foreground">{k}</dt></div>
            ))}
            {brief.dateRange && (
              <div className="col-span-2 py-1 sm:col-span-1"><dd className="text-sm">{formatDate(brief.dateRange[0])} – {formatDate(brief.dateRange[1])}</dd><dt className="text-[11px] text-muted-foreground">Published range</dt></div>
            )}
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">Topics: {brief.topics.join(", ")}</p>
        </section>

        <section>
          <h2 className="eyebrow mb-3">Observed themes</h2>
          <ul className="divide-y divide-border">
            {brief.themes.map((t) => (
              <li key={t.id} className="py-3">
                <p className="font-medium">{t.label} <span className="font-mono text-xs text-muted-foreground">{t.recordIds.length}/{brief.recordCount}</span></p>
                <p className="text-sm text-muted-foreground">{t.description}</p>
                <p className="mt-1 flex flex-wrap gap-2">{t.recordIds.map((id) => <Ref key={id} id={id} />)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="eyebrow mb-3">Contrasting perspectives</h2>
          <p className="text-sm">{brief.comparisonNote}</p>
          <ul className="mt-3 space-y-1.5">
            {brief.perspectives.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2 text-sm"><span className="font-medium">{p.label}</span>{p.recordIds.map((id) => <Ref key={id} id={id} />)}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="eyebrow mb-3">Supporting excerpts</h2>
          <ul className="space-y-4">
            {brief.excerpts.map((e) => (
              <li key={e.recordId} className="border-l-2 border-primary pl-4">
                <p className="font-display text-xl leading-snug">{e.modality === "visual" ? e.excerpt : `“${e.excerpt}”`}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Ref id={e.recordId} /> · {e.modality} · {formatTime(e.startSeconds)}–{formatTime(e.endSeconds)} · {e.title}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="eyebrow mb-3">Questions requiring independent verification</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">{brief.verification.map((v) => <li key={v}>{v}</li>)}</ul>
        </section>

        <section>
          <h2 className="eyebrow mb-3">Potential editorial angles</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">{brief.angles.map((a) => <li key={a}>{a}</li>)}</ul>
        </section>
      </article>
    </div>
  );
}
