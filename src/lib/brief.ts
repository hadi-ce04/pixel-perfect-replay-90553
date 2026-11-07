import type { AiBrief, AiComparison, AiPassage } from "./ai-analysis";
import { RELATIONSHIP_SENTENCE, briefPassages } from "./ai-analysis";
import { perspectiveOf, topicOf } from "@/data/catalog";
import { formatTimeRange } from "./format";
import type { VideoRecord } from "./types";
import { analyzeEvidence, type EvidenceAnalysis, type PassageRef, type ThemeKind } from "./analysis";
import { leadThemeDefinition, validReportingLead, type ReportingLead } from "./tensions";
import { searchableFacets } from "./query-plan";
import { excerptWindow, findTerm } from "./text";

export interface BriefReference {
  recordId: string;
  title: string;
  sourceUrl: string | null;
  excerpt: string;
  modality: string;
  startSeconds: number | null;
  endSeconds: number | null;
  /** True when a long passage was cut to an exact window; ellipses mark the cut. */
  shortened?: boolean;
}

export interface BriefTheme {
  id: string;
  label: string;
  kind: ThemeKind;
  description: string;
  recordIds: string[];
  supports: BriefReference[];
}

export interface BriefInterpretation {
  facets: { key: string; label: string; kind: string; role: string; terms: string[] }[];
  ignored: string[];
  notes: string[];
}

export interface Brief {
  dataMode: "mock" | "live" | "mixed";
  question: string;
  recordCount: number;
  platforms: Record<string, number>;
  topics: string[];
  dateRange: [string, string] | null;
  themes: BriefTheme[];
  perspectives: { id: string; label: string; recordIds: string[] }[];
  comparisonNote: string;
  excerpts: BriefReference[];
  verification: string[];
  angles: string[];
  reportingLead: ReportingLead | null;
  tensionExcerpts: BriefReference[];
  interpretation: BriefInterpretation | null;
  /** AI comparison saved with the reporting lead (only while the lead is valid). */
  aiComparison: AiComparison | null;
  /** AI reading of the selected evidence, if the user generated one. */
  ai: AiBrief | null;
  /** Passages the AI brief cited, by ref (S1..), for mapping quotes back to records. */
  aiPassages: AiPassage[];
}

const KIND_LABEL: Record<ThemeKind, string> = {
  "question-term": "question term",
  "recurring-phrase": "recurring phrase",
  hashtag: "hashtag",
  catalog: "demo theme",
  "legacy-keyword": "legacy keyword tag",
};

function supportReference(ref: PassageRef, record: VideoRecord): BriefReference {
  const window = excerptWindow(ref.excerpt, ref.match);
  return {
    recordId: ref.recordId,
    title: record.title,
    sourceUrl: record.sourceUrl,
    excerpt: window.text,
    modality: ref.modality,
    startSeconds: ref.startSeconds,
    endSeconds: ref.endSeconds,
    ...(window.shortened ? { shortened: true } : {}),
  };
}

/** Deterministic brief derived only from the saved records. */
export function generateBrief(
  question: string,
  records: VideoRecord[],
  selectedLead?: ReportingLead | null,
  analysisInput?: EvidenceAnalysis,
  aiBrief?: AiBrief | null,
): Brief {
  const sorted = [...new Map(records.map((r) => [r.id, r])).values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const leadDef = selectedLead ? leadThemeDefinition(selectedLead, analysisInput) : null;
  const analysis =
    analysisInput && (!leadDef || analysisInput.byId[leadDef.id])
      ? analysisInput
      : analyzeEvidence(question, sorted, { extraThemes: leadDef ? [leadDef] : [] });
  const byId = new Map(sorted.map((r) => [r.id, r]));
  const platforms: Record<string, number> = {};
  const perspMap = new Map<string, string[]>();
  for (const r of sorted) {
    platforms[r.platform] = (platforms[r.platform] ?? 0) + 1;
    perspMap.set(r.perspective, [...(perspMap.get(r.perspective) ?? []), r.id]);
  }
  const dates = sorted
    .map((r) => r.publishedAt)
    .filter(Boolean)
    .sort();
  const themes: BriefTheme[] = analysis.themes
    .map((t) => {
      const recordIds = t.recordIds.filter((id) => byId.has(id));
      const supports: BriefReference[] = [];
      for (const ref of t.supports) {
        if (supports.length >= 2) break;
        if (ref.field === "record" || !byId.has(ref.recordId)) continue;
        if (supports.some((s) => s.recordId === ref.recordId)) continue;
        supports.push(supportReference(ref, byId.get(ref.recordId)!));
      }
      return { id: t.id, label: t.label, kind: t.kind, description: t.description, recordIds, supports };
    })
    .filter((t) => t.recordIds.length)
    .sort((a, b) => b.recordIds.length - a.recordIds.length || a.label.localeCompare(b.label));
  const perspectives = [...perspMap]
    .map(([id, recordIds]) => ({ id, label: perspectiveOf(id)?.label ?? id, recordIds }))
    .sort((a, b) => b.recordIds.length - a.recordIds.length || a.label.localeCompare(b.label));

  let comparisonNote: string;
  if (sorted.length < 2)
    comparisonNote = "Only one record is selected. Save more evidence to compare perspectives.";
  else if (sorted.some((r) => r.perspective === "unclassified"))
    comparisonNote =
      "Speaker perspectives have not been classified for all selected sources. This selection does not establish agreement or disagreement.";
  else if (perspectives.length < 2)
    comparisonNote = `All selected records share one perspective (${perspectives[0]?.label}). The selection cannot support a contrast between viewpoints.`;
  else
    comparisonNote = `The selection includes ${perspectives.length} distinct perspectives, listed below with their records.`;

  const facetTerms = searchableFacets(analysis.plan).map((f) => f.terms);
  const excerpts: BriefReference[] = sorted.map((r) => {
    // Prefer the passage that contains the most terms from the research question.
    let bestIndex = -1,
      bestHits = 0;
    if (r.dataMode === "live")
      r.evidence.forEach((e, i) => {
        const hits = facetTerms.filter((terms) => findTerm(e.excerpt, terms)).length;
        if (hits > bestHits) {
          bestHits = hits;
          bestIndex = i;
        }
      });
    const e =
      bestIndex >= 0
        ? r.evidence[bestIndex]
        : (r.evidence.find((x) => x.modality === "speech") ?? r.evidence[0]);
    const match = e ? facetTerms.map((t) => findTerm(e.excerpt, t)).find(Boolean) ?? null : null;
    const window = e && r.dataMode === "live" ? excerptWindow(e.excerpt, match) : null;
    return {
      recordId: r.id,
      title: r.title,
      sourceUrl: r.sourceUrl,
      excerpt: window?.text ?? e?.excerpt ?? "",
      modality: e?.modality ?? "speech",
      startSeconds: e?.startSeconds ?? null,
      endSeconds: e?.endSeconds ?? null,
      ...(window?.shortened ? { shortened: true } : {}),
    };
  });

  const verification: string[] = [];
  const numeric = sorted.filter((r) => r.evidence.some((e) => /\d/.test(e.excerpt)));
  if (numeric.length)
    verification.push(
      `Figures cited in ${numeric.map((r) => r.id).join(", ")} (prices, counts, dates, results) need checking against official or primary sources.`,
    );
  verification.push(
    "Confirm the identity and circumstances of each speaker; creator labels are descriptive and unverified.",
  );
  if (sorted.some((r) => r.dataMode === "live"))
    verification.push(
      "Theme labels are terms found in the source text. They do not establish what each speaker claims, believes or represents.",
    );
  if (sorted.some((r) => r.perspective === "advocate"))
    verification.push(
      "Advocacy claims (e.g. demand increases, petition sizes) should be confirmed with the organisations and independent data.",
    );
  if (sorted.some((r) => r.perspective === "skeptic"))
    verification.push(
      "Contrarian arguments in the selection should be tested against available statistics before being framed as counterpoints.",
    );
  if (sorted.some((r) => r.dataMode === "mock"))
    verification.push(
      "This selection contains fictional demonstration records; replace them with real, verified sources before any publication.",
    );

  const angles: string[] = [];
  const t0 = themes[0],
    t1 = themes[1];
  if (t0 && t0.recordIds.length < 2)
    angles.push(
      "No theme recurs across records yet; save more evidence before choosing a lead theme.",
    );
  else if (t0)
    angles.push(
      t0.kind === "catalog"
        ? `Lead with "${t0.label}", the most recurrent theme in this selection (${t0.recordIds.length} of ${sorted.length} records).`
        : `Start from "${t0.label}", the most widely shared term in this selection (${t0.recordIds.length} of ${sorted.length} records); read the passages to establish what is actually said.`,
    );
  const [p0, p1] = perspectives;
  if (p0 && p1 && !perspectives.some((p) => p.id === "unclassified"))
    angles.push(
      `Contrast ${p0.label.toLowerCase()} accounts with ${p1.label.toLowerCase()} viewpoints already present in the selection.`,
    );
  if (t0 && t1)
    angles.push(`Explore how "${t0.label}" connects to "${t1.label}" in the same records.`);
  if (sorted.some((r) => r.evidence.some((e) => e.modality === "visual")))
    angles.push(
      "Visual evidence in the selection could support a documentary or photo-led treatment.",
    );

  const reportingLead = validReportingLead(selectedLead, question, records, analysis);
  const tensionExcerpts: BriefReference[] = reportingLead
    ? reportingLead.recordIds.map((id, index) => {
        const record = records.find((r) => r.id === id)!;
        const evidence = record.evidence[reportingLead.evidenceIndices[index]!]!;
        return {
          recordId: id,
          title: record.title,
          sourceUrl: record.sourceUrl,
          excerpt: evidence.excerpt,
          modality: evidence.modality,
          startSeconds: evidence.startSeconds,
          endSeconds: evidence.endSeconds,
        };
      })
    : [];
  const hasLive = sorted.some((r) => r.dataMode === "live");
  // The AI brief cites S-refs; the same deterministic passage selection maps them back.
  const aiPassages = aiBrief ? briefPassages(question, sorted) : [];
  return {
    reportingLead,
    tensionExcerpts,
    aiComparison: reportingLead?.ai ?? null,
    ai: aiBrief && aiPassages.length ? aiBrief : null,
    aiPassages: aiBrief ? aiPassages : [],
    dataMode: sorted.every((r) => r.dataMode === "mock")
      ? "mock"
      : sorted.every((r) => r.dataMode === "live")
        ? "live"
        : "mixed",
    question,
    recordCount: sorted.length,
    platforms,
    topics: [
      ...new Set(sorted.filter((r) => r.dataMode === "mock").map((r) => topicOf(r.topic).label)),
    ],
    dateRange: dates.length ? [dates[0]!, dates[dates.length - 1]!] : null,
    themes,
    perspectives,
    comparisonNote,
    excerpts,
    verification,
    angles,
    interpretation: hasLive
      ? {
          facets: analysis.plan.facets.map((f) => ({
            key: f.key,
            label: f.label,
            kind: f.kind,
            role: f.role,
            terms: f.terms,
          })),
          ignored: analysis.plan.ignored,
          notes: analysis.plan.notes,
        }
      : null,
  };
}

const quote = (r: BriefReference) =>
  `"${r.excerpt}"${r.shortened ? " (shortened; full passage in source)" : ""}`;

export function briefToMarkdown(b: Brief): string {
  const L: string[] = [];
  L.push(
    b.dataMode === "mock"
      ? "# PARALLAX — Demonstration editorial brief"
      : "# PARALLAX — Editorial research brief",
    "",
  );
  L.push(
    b.dataMode === "mock"
      ? "> Based on fictional demonstration records. Not real sources. Not representative of public opinion."
      : b.dataMode === "mixed"
        ? "> Contains fictional demonstration records mixed with source records. Not suitable for publication."
        : "> Based on selected source records. Claims require independent verification; this selection is not representative of public opinion.",
    "",
  );
  L.push(`**Research question:** ${b.question || "—"}`, "");
  if (b.interpretation) {
    L.push("## How the question was read");
    L.push(
      "Exact text matching over speech transcripts, on-screen text and captions. Not semantic understanding.",
    );
    const searched = b.interpretation.facets.filter((f) => f.role !== "context");
    const context = b.interpretation.facets.filter((f) => f.role === "context");
    searched.forEach((f) => L.push(`- ${f.label} (${f.kind}, ${f.role}): ${f.terms.join(", ")}`));
    if (context.length)
      L.push(
        `- Not used as a search constraint: ${context.map((f) => f.label).join(", ")} (speaker identity cannot be verified from text)`,
      );
    if (b.interpretation.ignored.length)
      L.push(`- Not searched: ${b.interpretation.ignored.join(", ")}`);
    b.interpretation.notes.forEach((n) => L.push(`- Note: ${n}`));
    L.push("");
  }
  if (b.reportingLead) {
    const themeLabel =
      b.themes.find((t) => t.id === b.reportingLead!.themeId)?.label ??
      b.reportingLead.theme?.label ??
      b.reportingLead.themeId;
    L.push(
      "## Selected reporting question",
      b.reportingLead.question,
      "",
      `Shared theme: ${themeLabel}`,
      "Not a verified conclusion. Investigate the different circumstances before treating the accounts as disagreement.",
      "",
    );
    b.reportingLead.recordIds.forEach((id, index) => {
      // Exports preserve the exact passages chosen in Story Tensions.
      const ref = b.tensionExcerpts[index];
      if (ref)
        L.push(
          `- ${id}, ${ref.modality}, ${formatTimeRange(ref.startSeconds, ref.endSeconds)}: ${ref.excerpt}`,
        );
    });
    L.push("");
  }
  L.push("## Source coverage");
  L.push(`- Records included: ${b.recordCount}`);
  L.push(
    `- Platforms: ${Object.entries(b.platforms)
      .map(([k, v]) => `${k} (${v})`)
      .join(", ")}`,
  );
  if (b.topics.length) L.push(`- Topics: ${b.topics.join(", ")}`);
  if (b.dateRange) L.push(`- Published: ${b.dateRange[0]} to ${b.dateRange[1]}`);
  L.push("", "## Observed themes");
  if (b.dataMode !== "mock")
    L.push(
      "Derived from the selected sources: terms from the research question and phrases recurring across records. Terms found in text, not verified claims.",
    );
  if (!b.themes.length) L.push("- No theme is supported by the selected passages.");
  b.themes.forEach((t) => {
    L.push(`- **${t.label}** · ${KIND_LABEL[t.kind]} — ${t.description} (${t.recordIds.join(", ")})`);
    t.supports.forEach((s) =>
      L.push(`  - ${s.recordId}, ${s.modality}, ${formatTimeRange(s.startSeconds, s.endSeconds)}: ${quote(s)}`),
    );
  });
  L.push("", "## Perspectives");
  L.push(b.comparisonNote);
  b.perspectives.forEach((p) => L.push(`- ${p.label}: ${p.recordIds.join(", ")}`));
  L.push("", "## Supporting excerpts");
  b.excerpts.forEach((e) => {
    L.push(
      `- ${quote(e)} — ${e.recordId}, ${e.modality}, ${formatTimeRange(e.startSeconds, e.endSeconds)}`,
    );
    if (e.sourceUrl?.startsWith("https://")) L.push(`  Source: ${e.sourceUrl}`);
  });
  appendAiSections(L, b);
  L.push("", "## Requires independent verification");
  b.verification.forEach((v) => L.push(`- ${v}`));
  L.push("", "## Potential editorial angles");
  b.angles.forEach((a) => L.push(`- ${a}`));
  return L.join("\n");
}

function aiStamp(model: string, generatedAt: string) {
  return `> AI-generated (${model}, ${generatedAt}). Check every quote against the source before use. Not a verified conclusion.`;
}

function citationLines(
  citations: { ref: string; quote: string }[],
  resolve: (ref: string) => { label: string } | null,
) {
  return citations.map((c) => {
    const where = resolve(c.ref);
    return `  > "${c.quote}" — ${where ? where.label : c.ref}`;
  });
}

function appendAiSections(L: string[], b: Brief) {
  if (b.aiComparison && b.reportingLead) {
    const c = b.aiComparison;
    const sides = b.tensionExcerpts;
    const resolve = (ref: string) => {
      const s = ref === "A" ? sides[0] : ref === "B" ? sides[1] : undefined;
      return s
        ? { label: `${ref}: ${s.recordId}, ${s.modality}, ${formatTimeRange(s.startSeconds, s.endSeconds)}` }
        : null;
    };
    L.push("", "## AI comparison of the selected passages", aiStamp(c.model, c.generatedAt), "");
    L.push(`**${RELATIONSHIP_SENTENCE[c.relationship]}.** ${c.summary}`);
    const kinds: [string, string][] = [
      ["common", "In common"],
      ["difference", "Differences"],
      ["context-gap", "Missing context"],
    ];
    for (const [kind, title] of kinds) {
      const points = c.points.filter((p) => p.kind === kind);
      if (!points.length) continue;
      L.push("", `**${title}**`);
      points.forEach((p) => L.push(`- ${p.text}`, ...citationLines(p.citations, resolve)));
    }
    if (c.caveats.length) L.push("", "**Caveats**", ...c.caveats.map((x) => `- ${x}`));
    if (c.droppedPoints)
      L.push("", `_${c.droppedPoints} AI point(s) were removed because their quotes did not match the source._`);
  }
  if (b.ai) {
    const a = b.ai;
    const byRef = new Map(b.aiPassages.map((p) => [p.ref, p]));
    const resolve = (ref: string) => {
      const p = byRef.get(ref);
      return p
        ? { label: `${p.recordId}, ${p.modality}, ${formatTimeRange(p.startSeconds, p.endSeconds)}` }
        : null;
    };
    L.push("", "## AI reading of the selected evidence", aiStamp(a.model, a.generatedAt), "");
    if (a.overview) L.push(a.overview);
    if (a.findings.length) {
      L.push("", "**Findings**");
      a.findings.forEach((f) => L.push(`- ${f.text}`, ...citationLines(f.citations, resolve)));
    }
    if (a.tensions.length) {
      L.push("", "**Tensions between passages**");
      a.tensions.forEach((f) => L.push(`- ${f.text}`, ...citationLines(f.citations, resolve)));
    }
    const lists: [string, string[]][] = [
      ["Gaps in the evidence", a.gaps],
      ["To verify", a.verification],
      ["Possible angles", a.angles],
    ];
    for (const [title, items] of lists)
      if (items.length) L.push("", `**${title}**`, ...items.map((x) => `- ${x}`));
    if (a.droppedPoints)
      L.push("", `_${a.droppedPoints} AI point(s) were removed because their quotes did not match the source._`);
  }
}
