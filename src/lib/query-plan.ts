/**
 * Turns a free-form research question into an explicit, inspectable search plan.
 *
 * This is deterministic text analysis, not semantic understanding: it keeps the full
 * question, extracts names, quoted phrases, hashtags, numbers and content words, and
 * lists every variant it will search for and why. Words describing who is speaking
 * ("French", "young people") are shown as context but never used as search constraints,
 * because a text match cannot establish a speaker's identity.
 */
import { LEXICON_MAX_WORDS, lexiconForms } from "./lexicon";
import {
  CONTEXT_WORDS,
  NAME_CONNECTORS,
  PLATFORM_WORDS,
  STOPWORDS,
  foldKey,
  looksFrench,
  stripAccents,
} from "./text";
import type { Platform } from "./types";

export type FacetRole = "anchor" | "topic" | "context";
export type FacetKind = "entity" | "phrase" | "hashtag" | "handle" | "keyword" | "number" | "context";
export type VariantReason = "as written" | "accent" | "plural" | "translation";

export interface QueryFacet {
  key: string;
  label: string;
  kind: FacetKind;
  role: FacetRole;
  terms: string[];
  variants: { term: string; reason: VariantReason }[];
}

export interface QueryPlan {
  question: string;
  language: "fr" | "en" | "mixed" | "unknown";
  facets: QueryFacet[];
  ignored: string[];
  platforms: Platform[];
  notes: string[];
}

const MAX_ANCHORS = 4;
const MAX_TOPICS = 5;
const MAX_TERMS = 10;

export function searchableFacets(plan: QueryPlan): QueryFacet[] {
  return plan.facets.filter((f) => f.role !== "context");
}

interface Tok {
  text: string;
  folded: string;
  boundary: boolean; // punctuation / sentence boundary marker
  sentenceStart: boolean;
}

function makeFacet(label: string, kind: FacetKind, role: FacetRole, forms: string[] | null): QueryFacet {
  const variants: { term: string; reason: VariantReason }[] = [];
  const seen = new Set<string>();
  const add = (term: string, reason: VariantReason) => {
    const t = term.trim();
    // Oriane is case-insensitive, so case-only duplicates are skipped.
    const k = t.toLowerCase();
    if (!t || seen.has(k) || variants.length >= MAX_TERMS) return;
    seen.add(k);
    variants.push({ term: t, reason });
  };
  add(label, "as written");
  const accent = (t: string, reason: VariantReason) => {
    add(t, reason);
    if (stripAccents(t) !== t) add(stripAccents(t), "accent");
  };
  if (stripAccents(label) !== label) add(stripAccents(label), "accent");
  if (forms) for (const f of forms) accent(f, "translation");
  else if (kind === "keyword") {
    const lower = label.toLowerCase();
    if (lower.length > 4 && /s$/.test(lower) && !/(ss|us|is)$/.test(lower)) accent(lower.slice(0, -1), "plural");
    else if (/ing$|ity$|ism$|isme$/.test(lower) || /\d/.test(lower)) {
      /* gerunds and abstract nouns: no reliable plural */
    } else if (/[^aeiou]y$/.test(lower)) accent(lower.slice(0, -1) + "ies", "plural");
    else if (lower.length >= 3 && !/[sxz]$/.test(lower)) accent(lower + "s", "plural");
  }
  return { key: foldKey(label), label, kind, role, terms: variants.map((v) => v.term), variants };
}

function cleanWord(raw: string): string {
  return raw
    .replace(/^(?:[ldjmnstc]|qu|jusqu|lorsqu|puisqu)['’](?=[\p{L}\p{N}])/iu, "")
    .replace(/['’]s$/i, "")
    .replace(/['’-]+$/, "")
    .replace(/^[-'’]+/, "");
}

const isCapitalized = (w: string) => /^\p{Lu}/u.test(w);
const hasInnerCaps = (w: string) => /^\p{Ll}+\p{Lu}/u.test(w) || /\p{L}\p{N}|\p{N}\p{L}/u.test(w);
const isAllCaps = (w: string) => w.length >= 2 && /^[\p{Lu}\p{N}]+$/u.test(w) && /\p{Lu}/u.test(w);

export function planQuery(question: string): QueryPlan {
  const original = question.trim().slice(0, 500);
  const facets: QueryFacet[] = [];
  const ignored: string[] = [];
  const platforms: Platform[] = [];
  const notes: string[] = [];
  const push = (f: QueryFacet) => {
    if (!f.key) return;
    const existing = facets.find((x) => x.key === f.key);
    if (existing) {
      // Stronger roles win when the same words appear twice.
      if (existing.role === "context" && f.role !== "context") facets[facets.indexOf(existing)] = f;
      return;
    }
    facets.push(f);
  };

  let rest = original;
  // 1. Quoted phrases are searched exactly as written.
  rest = rest.replace(/["“”«»]\s*([^"“”«»]{2,80}?)\s*["“”«»]/g, (_, p: string) => {
    push(makeFacet(p.trim(), "phrase", "anchor", null));
    return " | ";
  });
  // 2. Hashtags and handles.
  rest = rest.replace(/#([\p{L}\p{N}_]{2,40})/gu, (_, tag: string) => {
    push(makeFacet(tag, "hashtag", "anchor", null));
    return " | ";
  });
  rest = rest.replace(/(^|\s)@([\w.]{2,30})/g, (_, lead: string, handle: string) => {
    push(makeFacet(handle.replace(/\.$/, ""), "handle", "anchor", null));
    return `${lead} | `;
  });

  // 3. Tokens, keeping punctuation as boundaries for name sequences.
  const raw = rest.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*|[|?.!,;:()]/gu) ?? [];
  const toks: Tok[] = [];
  let sentenceStart = true;
  for (const r of raw) {
    if (/^[|?.!,;:()]$/.test(r)) {
      toks.push({ text: r, folded: "", boundary: true, sentenceStart: false });
      if (/[?.!|]/.test(r)) sentenceStart = true;
      continue;
    }
    const w = cleanWord(r);
    if (!w) continue;
    toks.push({ text: w, folded: foldKey(w), boundary: false, sentenceStart });
    sentenceStart = false;
  }

  const isStop = (t: Tok) => STOPWORDS.has(t.folded) && !PLATFORM_WORDS[t.folded];
  let i = 0;
  while (i < toks.length) {
    const t = toks[i]!;
    if (t.boundary) {
      i++;
      continue;
    }
    // Lexicon phrases first (longest match), e.g. "coupe du monde", "réseaux sociaux".
    let matched = false;
    for (let n = Math.min(LEXICON_MAX_WORDS, toks.length - i); n >= 2; n--) {
      const slice = toks.slice(i, i + n);
      if (slice.some((x) => x.boundary)) continue;
      const label = slice.map((x) => x.text).join(" ");
      const forms = lexiconForms(label);
      if (forms) {
        push(makeFacet(label, "keyword", "topic", forms));
        i += n;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    if (PLATFORM_WORDS[t.folded]) {
      const p = PLATFORM_WORDS[t.folded]!;
      if (!platforms.includes(p)) platforms.push(p);
      i++;
      continue;
    }

    const capitalLike = isCapitalized(t.text) || hasInnerCaps(t.text) || isAllCaps(t.text);
    if (capitalLike && !CONTEXT_WORDS.has(t.folded)) {
      // Collect a proper-name sequence.
      let j = i + 1;
      const parts = [t.text];
      while (j < toks.length) {
        const n = toks[j]!;
        if (n.boundary) break;
        if (isCapitalized(n.text) || isAllCaps(n.text) || hasInnerCaps(n.text) || /^\d{2,4}$/.test(n.text)) {
          if (PLATFORM_WORDS[n.folded] || CONTEXT_WORDS.has(n.folded)) break;
          parts.push(n.text);
          j++;
        } else if (
          NAME_CONNECTORS.has(n.folded) &&
          toks[j + 1] &&
          !toks[j + 1]!.boundary &&
          isCapitalized(toks[j + 1]!.text)
        ) {
          parts.push(n.text, toks[j + 1]!.text);
          j += 2;
        } else break;
      }
      const single = parts.length === 1;
      const sentenceInitialCommon =
        single &&
        t.sentenceStart &&
        !isAllCaps(t.text) &&
        !hasInnerCaps(t.text) &&
        (isStop(t) || lexiconForms(t.text) !== null);
      if (!sentenceInitialCommon && !(single && isStop(t) && !isAllCaps(t.text))) {
        const label = parts.join(" ");
        push(makeFacet(label, "entity", "anchor", lexiconForms(label)));
        i = j;
        continue;
      }
    }

    if (isStop(t)) {
      if (!ignored.includes(t.text.toLowerCase())) ignored.push(t.text.toLowerCase());
    } else if (CONTEXT_WORDS.has(t.folded)) {
      push(makeFacet(t.text, "context", "context", null));
    } else if (/^\d+$/.test(t.text)) {
      if (t.text.length >= 2) {
        push(makeFacet(t.text, "number", "topic", null));
        if (/^(19|20)\d{2}$/.test(t.text) && !notes.some((n) => n.startsWith("Years")))
          notes.push(
            "Years in the question are searched as text, not used as a publication-date filter. Use the Published filter to limit dates.",
          );
      } else ignored.push(t.text);
    } else if (t.folded.length < 3 && !lexiconForms(t.text)) {
      ignored.push(t.text.toLowerCase());
    } else {
      const forms = lexiconForms(t.text);
      push(makeFacet(forms ? t.text.toLowerCase() : t.text.toLowerCase(), "keyword", "topic", forms));
    }
    i++;
  }

  // Role caps keep the request bounded; dropped words are reported, not silently lost.
  const anchors = facets.filter((f) => f.role === "anchor");
  const topics = facets.filter((f) => f.role === "topic");
  const drop = [...anchors.slice(MAX_ANCHORS), ...topics.slice(MAX_TOPICS)];
  if (drop.length) {
    notes.push(
      `Only the first ${MAX_ANCHORS} names/phrases and ${MAX_TOPICS} topic words are searched. Not searched: ${drop
        .map((f) => f.label)
        .join(", ")}.`,
    );
  }
  let kept = facets.filter((f) => !drop.includes(f));
  if (!kept.some((f) => f.role !== "context") && kept.some((f) => f.role === "context")) {
    kept = kept.map((f) => ({ ...f, role: "topic" as const, kind: "keyword" as const }));
    notes.push("Only descriptive words were found, so they are searched as text.");
  }
  if (platforms.length)
    notes.push(
      `Platform named in the question (${platforms.join(", ")}) is applied as a platform filter unless you choose one.`,
    );

  return {
    question: original,
    language: looksFrench(original),
    facets: kept,
    ignored: [...new Set(ignored)].slice(0, 20),
    platforms,
    notes,
  };
}
