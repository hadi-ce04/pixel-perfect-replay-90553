import type { AiCitation, AiPassage } from "@/lib/ai-analysis";
import { formatTimeRange } from "@/lib/format";

/** Exact quotes the AI cited, each tied back to its source passage. Quotes are rendered verbatim. */
export function AiCitations({
  citations,
  passages,
  label = "letter",
}: {
  citations: AiCitation[];
  passages: AiPassage[];
  label?: "letter" | "record";
}) {
  if (!citations.length) return null;
  return (
    <ul className="ai-citations">
      {citations.map((c, i) => {
        const p = passages.find((x) => x.ref === c.ref);
        return (
          <li key={`${c.ref}-${i}`}>
            <blockquote>“{c.quote}”</blockquote>
            <span className="ai-citation-source">
              <span className="font-mono">
                {label === "letter" ? c.ref : (p?.recordId ?? c.ref)}
              </span>
              {p && (
                <>
                  {" · "}
                  {p.modality} · {formatTimeRange(p.startSeconds, p.endSeconds)}
                </>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function AiProvenance({ model, generatedAt }: { model: string; generatedAt: string }) {
  const at = new Date(generatedAt);
  return (
    <p className="ai-provenance">
      AI-generated · <span className="font-mono">{model}</span>
      {Number.isNaN(at.getTime()) ? "" : ` · ${at.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`}
      . A reading of the quoted passages, not a verified finding. Check every quote against the
      source before use.
    </p>
  );
}

export const RELATIONSHIP_TEXT: Record<string, string> = {
  agree: "The two passages appear to say compatible things.",
  differ: "The two passages appear to differ.",
  "different-scope": "The two passages cover different scopes, so they do not directly contradict.",
  complementary: "The two passages add different pieces to the same picture.",
  unclear: "The passages do not give enough to say how they relate.",
};
