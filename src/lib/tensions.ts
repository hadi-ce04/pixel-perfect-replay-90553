import { themeById } from "@/data/catalog";
import {
  analyzeEvidence,
  catalogThemeDefinition,
  resolveTheme,
  singleThemeAnalysis,
  themeSupports,
  type EvidenceAnalysis,
  type EvidenceTheme,
  type ThemeDefinition,
} from "./analysis";
import type { EvidenceEntry, VideoRecord } from "./types";

export interface ReportingLead {
  themeId: string;
  researchQuestion: string;
  recordIds: [string, string];
  evidenceIndices: [number, number];
  excerptTexts: [string, string];
  question: string;
  /** Snapshot of the theme definition, so the lead stays resolvable after reload. */
  theme?: ThemeDefinition;
}

export interface EvidenceReference {
  record: VideoRecord;
  index: number;
  evidence: EvidenceEntry;
}

// Editorial notes for exact fictional passages, never a live-analysis fallback.
const DEMO_READINGS = [
  {
    themeId: "guarantor",
    ids: ["HOU-002", "HOU-008"],
    excerpts: [
      "We receive forty files for one studio. Without a guarantor earning three times the rent, the owner won't even look at it.",
      "A public guarantee scheme exists for students without a guarantor",
    ],
    title: "A guarantee exists. Access is another question.",
    reading:
      "One excerpt describes a rental screening requirement. The other points to a public guarantee. Together, they raise a question about the gap between available support and access to housing.",
    question:
      "Why can students still face guarantor barriers when a public guarantee scheme exists?",
  },
  {
    themeId: "rent-burden",
    ids: ["HOU-001", "HOU-006"],
    excerpts: [
      "Rent is 690 euros, my scholarship is 580. So before I've eaten anything, I'm already negative.",
      "Every autumn we hear about students, but apprentices and young workers face the same prices with fewer aids.",
    ],
    title: "A personal shortfall. A wider housing question.",
    reading:
      "One account describes a student's rent and scholarship. The other broadens the discussion to young workers and apprentices. These are different scopes, rather than evidence that either account is wrong.",
    question:
      "How do housing costs and available support differ for students, apprentices, and young workers?",
  },
] as const;

const defaultAnalysis = (records: VideoRecord[]) => analyzeEvidence("", records);

export function eligibleTensionRecords(
  records: VideoRecord[],
  themeId: string,
  analysis: EvidenceAnalysis = defaultAnalysis(records),
) {
  const theme = analysis.byId[themeId];
  if (!theme) return [];
  const ids = new Set(theme.recordIds);
  return [
    ...new Map(
      records
        .filter((r) => ids.has(r.id) && r.evidence.some((e) => e.excerpt.trim()))
        .map((r) => [r.id, r]),
    ).values(),
  ];
}

export function comparisonThemes(
  records: VideoRecord[],
  analysis: EvidenceAnalysis = defaultAnalysis(records),
) {
  return analysis.themes
    .map((t) => t.id)
    .filter((id) => eligibleTensionRecords(records, id, analysis).length >= 2);
}

function findDemoReading(themeId: string, left: EvidenceReference, right: EvidenceReference) {
  if (left.record.dataMode !== "mock" || right.record.dataMode !== "mock") return undefined;
  return DEMO_READINGS.find(
    (d) =>
      d.themeId === themeId &&
      ((d.ids[0] === left.record.id &&
        d.ids[1] === right.record.id &&
        d.excerpts[0] === left.evidence.excerpt &&
        d.excerpts[1] === right.evidence.excerpt) ||
        (d.ids[1] === left.record.id &&
          d.ids[0] === right.record.id &&
          d.excerpts[1] === left.evidence.excerpt &&
          d.excerpts[0] === right.evidence.excerpt)),
  );
}

export function suggestTensionPair(
  records: VideoRecord[],
  themeId: string,
  analysis: EvidenceAnalysis = defaultAnalysis(records),
): [string, string] | null {
  const eligible = eligibleTensionRecords(records, themeId, analysis).sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  // A prepared demo can only be suggested when its exact excerpts are present.
  for (const reading of DEMO_READINGS.filter((d) => d.themeId === themeId)) {
    const left = eligible.find(
      (r) =>
        r.id === reading.ids[0] &&
        r.dataMode === "mock" &&
        r.evidence.some((e) => e.excerpt === reading.excerpts[0]),
    );
    const right = eligible.find(
      (r) =>
        r.id === reading.ids[1] &&
        r.dataMode === "mock" &&
        r.evidence.some((e) => e.excerpt === reading.excerpts[1]),
    );
    if (left && right) return [left.id, right.id];
  }
  for (const left of eligible) {
    const right = eligible.find((r) => r.id !== left.id && r.perspective !== left.perspective);
    if (right) return [left.id, right.id];
  }
  return eligible.length >= 2 ? [eligible[0]!.id, eligible[1]!.id] : null;
}

/** First passage that contains the theme term; otherwise the first usable speech/text passage. */
export function defaultEvidenceIndex(record: VideoRecord, theme?: ThemeDefinition) {
  if (theme && theme.kind !== "catalog") {
    const support = themeSupports(theme, record).find(
      (s) => s.field === "evidence" && s.evidenceIndex !== null && s.excerpt.trim(),
    );
    if (support) return support.evidenceIndex!;
  }
  const speech = record.evidence.findIndex((e) => e.modality === "speech" && e.excerpt.trim());
  return speech >= 0
    ? speech
    : Math.max(
        0,
        record.evidence.findIndex((e) => e.excerpt.trim()),
      );
}

export function suggestedEvidenceIndices(
  records: VideoRecord[],
  themeId: string,
  ids: [string, string],
  analysis: EvidenceAnalysis = defaultAnalysis(records),
): [number, number] {
  const reading = DEMO_READINGS.find(
    (d) => d.themeId === themeId && d.ids[0] === ids[0] && d.ids[1] === ids[1],
  );
  const theme = analysis.byId[themeId];
  return ids.map((id, i) => {
    const record = records.find((r) => r.id === id)!;
    const exact =
      reading && record.dataMode === "mock"
        ? record.evidence.findIndex((e) => e.excerpt === reading.excerpts[i])
        : -1;
    return exact >= 0 ? exact : defaultEvidenceIndex(record, theme);
  }) as [number, number];
}

function passageContains(theme: EvidenceTheme, ref: EvidenceReference) {
  if (theme.kind === "catalog" || theme.kind === "hashtag") return false;
  return themeSupports(theme, ref.record).some(
    (s) => s.field === "evidence" && s.evidenceIndex === ref.index,
  );
}

function wording(theme: EvidenceTheme) {
  const label = theme.label;
  switch (theme.kind) {
    case "question-term":
      return {
        title: `Two accounts that mention “${label}”.`,
        reading: `Both records contain “${label}”, a term from your research question. A shared term and different perspective labels do not establish a disagreement, or even a shared claim. Read each passage in context.`,
        question: `What does each account say about “${label}”, and which circumstances should a reporter check before comparing them?`,
      };
    case "recurring-phrase":
      return {
        title: `Two accounts that use “${label}”.`,
        reading: `“${label}” recurs in both records. A shared phrase and different perspective labels do not establish a disagreement, or even a shared claim. Read each passage in context.`,
        question: `What does each account mean by “${label}”, and which circumstances should a reporter check before comparing them?`,
      };
    case "hashtag":
      return {
        title: `Two posts tagged ${label}.`,
        reading: `Both posts are tagged ${label}. Hashtags describe the post, not what the speaker says; a shared tag and different perspective labels do not establish a disagreement.`,
        question: `What do these two posts tagged ${label} actually say, and which circumstances should a reporter check?`,
      };
    default:
      return {
        title: `Two accounts of ${label.toLowerCase()}.`,
        reading: `Both selected records are tagged with “${label}”. Compare the excerpts and their circumstances to decide what they reveal together. A shared theme or different perspective labels do not establish a disagreement.`,
        question: `What explains the experiences or explanations of ${label.toLowerCase()} in these two accounts, and which circumstances should a reporter check?`,
      };
  }
}

export function buildTensionComparison(
  records: VideoRecord[],
  themeId: string,
  ids: [string, string],
  indices: [number, number],
  analysis: EvidenceAnalysis = defaultAnalysis(records),
) {
  if (ids[0] === ids[1]) return null;
  const theme = analysis.byId[themeId];
  if (!theme) return null;
  const eligible = eligibleTensionRecords(records, themeId, analysis);
  const references = ids.map((id, i) => {
    const record = eligible.find((r) => r.id === id);
    const index = indices[i]!;
    const evidence = record?.evidence[index];
    return record && evidence?.excerpt.trim() ? { record, index, evidence } : null;
  });
  const left = references[0],
    right = references[1];
  if (!left || !right) return null;
  const prepared = theme.kind === "catalog" ? findDemoReading(themeId, left, right) : undefined;
  const text = wording(theme);
  return {
    themeId,
    theme,
    left,
    right,
    title: prepared?.title ?? text.title,
    reading: prepared?.reading ?? text.reading,
    question: prepared?.question ?? text.question,
    interpretation: prepared ? ("prepared-demo" as const) : ("research-prompt" as const),
    differentPerspectives: left.record.perspective !== right.record.perspective,
    passageMatches: [passageContains(theme, left), passageContains(theme, right)] as [boolean, boolean],
  };
}

/** The definition a saved lead refers to: its own snapshot, the demo catalog, or the current analysis. */
export function leadThemeDefinition(
  lead: ReportingLead,
  analysis?: EvidenceAnalysis,
): ThemeDefinition | null {
  if (lead.theme) return lead.theme;
  if (themeById[lead.themeId]) return catalogThemeDefinition(lead.themeId);
  const t = analysis?.byId[lead.themeId];
  return t ? { id: t.id, kind: t.kind, label: t.label, terms: t.terms } : null;
}

export function validReportingLead(
  lead: ReportingLead | null | undefined,
  question: string,
  records: VideoRecord[],
  analysis?: EvidenceAnalysis,
) {
  if (!lead || lead.researchQuestion !== question || !lead.question.trim()) return null;
  const def = leadThemeDefinition(lead, analysis);
  if (!def) return null;
  const theme = resolveTheme(def, records);
  const comparison = buildTensionComparison(
    records,
    def.id,
    lead.recordIds,
    lead.evidenceIndices,
    singleThemeAnalysis(question, theme),
  );
  return comparison &&
    comparison.left.evidence.excerpt === lead.excerptTexts[0] &&
    comparison.right.evidence.excerpt === lead.excerptTexts[1]
    ? lead
    : null;
}
