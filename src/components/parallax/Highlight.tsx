import { Fragment } from "react";
import { findAllTerms } from "@/lib/text";

/** Marks matched terms inside an exact source passage. The text itself is never altered. */
export function Highlight({ text, terms }: { text: string; terms: readonly string[] }) {
  if (!terms.length) return <>{text}</>;
  const matches = findAllTerms(text, terms);
  if (!matches.length) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let at = 0;
  matches.forEach((m, i) => {
    if (m.start > at) parts.push(<Fragment key={`t${i}`}>{text.slice(at, m.start)}</Fragment>);
    parts.push(
      <mark key={`m${i}`} className="px-0.5">
        {text.slice(m.start, m.end)}
      </mark>,
    );
    at = m.end;
  });
  if (at < text.length) parts.push(<Fragment key="end">{text.slice(at)}</Fragment>);
  return <>{parts}</>;
}
