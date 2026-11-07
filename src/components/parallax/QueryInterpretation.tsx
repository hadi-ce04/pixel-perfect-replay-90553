import type { OrianeSearchInfo } from "@/lib/oriane-provider";
import type { QueryFacet } from "@/lib/query-plan";

const ROLE_LABEL: Record<QueryFacet["role"], string> = {
  anchor: "Required",
  topic: "Topic term",
  context: "Context",
};

const KIND_LABEL: Record<QueryFacet["kind"], string> = {
  entity: "name",
  phrase: "exact phrase",
  hashtag: "hashtag",
  handle: "account",
  keyword: "keyword",
  number: "number",
  context: "descriptor",
};

/** Shows exactly how a live question was turned into an Oriane search. */
export function QueryInterpretation({
  info,
  unmatchedFacets = [],
}: {
  info: OrianeSearchInfo | null;
  unmatchedFacets?: string[];
}) {
  if (!info)
    return (
      <div className="mt-5 border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
        Live Oriane search across speech, on-screen text and captions. Parallax reads your question
        into search terms; the interpretation appears here once results load.
      </div>
    );
  const { plan, matching } = info;
  const searched = plan.facets.filter((f) => f.role !== "context");
  const context = plan.facets.filter((f) => f.role === "context");
  return (
    <section
      aria-label="How Parallax read your question"
      className="mt-5 border border-border bg-card p-4 text-xs leading-relaxed"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow text-primary">How Parallax read your question</p>
        <span className="text-[10px] text-muted-foreground">
          Exact text matching, not semantic understanding
          {plan.language !== "unknown" ? ` · question language: ${plan.language}` : ""}
        </span>
      </div>
      <ul className="mt-3 space-y-2" aria-label="Search terms">
        {searched.map((f) => {
          const extra = f.variants.filter((v) => v.reason !== "as written");
          const missing = unmatchedFacets.includes(f.key);
          return (
            <li key={f.key} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span
                className={`rounded-sm border px-1.5 py-0.5 font-semibold ${f.role === "anchor" ? "border-primary text-foreground" : "border-border text-foreground"}`}
              >
                {f.label}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {ROLE_LABEL[f.role]} · {KIND_LABEL[f.kind]}
              </span>
              {extra.length > 0 && (
                <span className="text-muted-foreground">
                  also searched:{" "}
                  {extra.map((v, i) => (
                    <span key={v.term}>
                      {i > 0 && ", "}
                      {v.term} <span className="text-[10px]">({v.reason})</span>
                    </span>
                  ))}
                </span>
              )}
              {missing && (
                <span className="text-primary">Not found in any returned passage</span>
              )}
            </li>
          );
        })}
      </ul>
      {context.length > 0 && (
        <p className="mt-3 text-muted-foreground">
          <strong className="text-foreground">Not used as a search constraint:</strong>{" "}
          {context.map((f) => f.label).join(", ")}. These describe who is speaking; a text match
          cannot verify a speaker's identity, age, nationality or stance.
        </p>
      )}
      {plan.ignored.length > 0 && (
        <p className="mt-2 text-muted-foreground">
          Not searched: {plan.ignored.slice(0, 14).join(", ")}
          {plan.ignored.length > 14 ? "…" : ""}
        </p>
      )}
      {plan.notes.map((n) => (
        <p key={n} className="mt-2 text-muted-foreground">
          {n}
        </p>
      ))}
      <p className="mt-3 border-t border-border pt-3 text-muted-foreground">
        {matching.strictShown} shown {matching.strictShown === 1 ? "record matches" : "records match"}{" "}
        every search term
        {matching.strictTotal > matching.strictShown ? ` (of ${matching.strictTotal} in Oriane)` : ""}
        {matching.broadTotal !== null &&
          `; ${matching.broadShown} more match required terms and at least one topic term (of ${matching.broadTotal})`}
        . {info.partial ? "Oriane returned a partial response (HTTP 206). " : ""}
        {info.limited
          ? "This is a capped result set, not the full matching population. "
          : ""}
        Use "quotes" for an exact phrase.
      </p>
    </section>
  );
}
