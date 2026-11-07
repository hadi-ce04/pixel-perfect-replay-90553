import { afterEach, describe, expect, it } from "vitest";
import { analyzeEvidence, resolveTheme, themeSupports } from "@/lib/analysis";
import { buildStoryGraph } from "@/lib/graph";
import { briefToMarkdown, generateBrief } from "@/lib/brief";
import {
  buildTensionComparison,
  comparisonThemes,
  suggestTensionPair,
  suggestedEvidenceIndices,
  validReportingLead,
  type ReportingLead,
} from "@/lib/tensions";
import { restoreReportingLead } from "@/lib/store";
import type { EvidenceEntry, VideoRecord } from "@/lib/types";

const speech = (excerpt: string, startSeconds: number, endSeconds: number): EvidenceEntry => ({
  modality: "speech",
  excerpt,
  startSeconds,
  endSeconds,
});

function live(id: string, evidence: EvidenceEntry[], extra: Partial<VideoRecord> = {}): VideoRecord {
  return {
    id,
    platform: "TikTok",
    sourceUrl: null,
    thumbnailUrl: null,
    title: `Source ${id}`,
    description: "",
    publishedAt: "2026-10-01T10:00:00Z",
    creatorLabel: "creator",
    durationSeconds: null,
    contentType: "Unclassified",
    topic: "unclassified",
    evidence,
    themes: [],
    perspective: "unclassified",
    dataMode: "live",
    annotationMethod: "evidence-terms",
    ...extra,
  };
}

const ELECTION_Q = "Que disent les électeurs sur les élections municipales ?";
const election = [
  live("cnt_a1", [
    speech("Bonjour à tous.", 0, 2.5),
    speech("Pour les élections municipales, le taux de participation inquiète.", 2.5, 7.25),
  ]),
  live("cnt_b2", [speech("Le taux de participation était faible aux municipales.", 10, 14.5)], {
    hashtags: ["#municipales2026", "#vote"],
  }),
  live("cnt_c3", [speech("Le débat sur les élections a duré deux heures.", 3, 6)], {
    hashtags: ["#municipales2026"],
  }),
];

describe("evidence-grounded themes", () => {
  it("derives question-term themes with exact excerpts and timestamps from live passages", () => {
    const a = analyzeEvidence(ELECTION_Q, election);
    const term = a.themes.find((t) => t.kind === "question-term" && /lection/i.test(t.label));
    expect(term).toBeDefined();
    expect(term!.recordIds).toEqual(expect.arrayContaining(["cnt_a1", "cnt_c3"]));
    const ref = term!.supports.find((s) => s.recordId === "cnt_a1")!;
    expect(ref.evidenceIndex).toBe(1);
    expect(ref.excerpt).toBe(election[0]!.evidence[1]!.excerpt);
    expect(ref.startSeconds).toBe(2.5);
    expect(ref.endSeconds).toBe(7.25);
    expect(ref.excerpt.slice(ref.match!.start, ref.match!.end).toLowerCase()).toContain("lections");
    // Election questions do not fall back to the fixed housing catalog.
    expect(a.themes.some((t) => t.kind === "catalog" || /rent|housing|loyer/i.test(t.label))).toBe(false);
  });

  it("requires a recurring phrase to appear in at least two distinct records", () => {
    const a = analyzeEvidence(ELECTION_Q, election);
    const phrase = a.themes.find((t) => t.id === "phrase:taux-de-participation");
    expect(phrase?.kind).toBe("recurring-phrase");
    expect(phrase?.recordIds).toEqual(["cnt_a1", "cnt_b2"]);
    expect(a.themes.some((t) => t.kind === "recurring-phrase" && /heures/.test(t.label))).toBe(false);
    const single = analyzeEvidence(ELECTION_Q, [election[0]!, { ...election[0]!, id: "cnt_a1" }]);
    expect(single.themes.some((t) => t.kind === "recurring-phrase")).toBe(false);
    expect(a.byId["tag:municipales2026"]?.recordIds).toEqual(["cnt_b2", "cnt_c3"]);
  });

  it("is deterministic regardless of record order", () => {
    const a = analyzeEvidence(ELECTION_Q, election);
    const b = analyzeEvidence(ELECTION_Q, [...election].reverse());
    expect(b.themes.map((t) => [t.id, t.label, t.recordIds])).toEqual(
      a.themes.map((t) => [t.id, t.label, t.recordIds]),
    );
  });

  it("does not match Portuguese word substrings to a French term", () => {
    const portuguese = live("cnt_pt", [speech("Garanta seu ingresso agora.", 0, 3)], {
      description: "garantir seu ingresso",
    });
    expect(themeSupports({ id: "x", kind: "question-term", label: "garant", terms: ["garant"] }, portuguese)).toEqual([]);
    expect(analyzeEvidence("garant", [portuguese]).unmatchedFacets).toContain("garant");
  });

  it("produces sport-specific themes for a named-entity sports question", () => {
    const sports = [
      live("cnt_s1", [speech("Mbappé a marqué un doublé ce soir au Bernabéu.", 0, 4)]),
      live("cnt_s2", [speech("Encore un doublé de Mbappé, le Bernabéu est debout.", 5, 9)]),
    ];
    const a = analyzeEvidence("How are fans reacting to Mbappé at Real Madrid?", sports);
    expect(a.method).toBe("evidence-terms");
    expect(a.themes.some((t) => t.kind === "question-term" && /mbapp/i.test(t.label))).toBe(true);
    expect(a.themes.some((t) => t.kind === "recurring-phrase" && /doubl/i.test(t.label))).toBe(true);
    expect(a.unmatchedFacets.some((k) => k.includes("real madrid"))).toBe(true);
    const graph = buildStoryGraph("Mbappé", sports, a);
    expect(graph.nodes.some((n) => n.kind === "theme" && /doubl/i.test(n.label))).toBe(true);
  });

  it("keeps the fictional catalog isolated to mock records", () => {
    const mock = { ...election[0]!, id: "HOU-X", dataMode: "mock" as const, themes: ["guarantor"] };
    const a = analyzeEvidence(ELECTION_Q, [mock, election[1]!]);
    expect(a.method).toBe("mixed");
    expect(a.byId["guarantor"]?.recordIds).toEqual(["HOU-X"]);
    expect(a.byId["guarantor"]?.kind).toBe("catalog");
  });
});

describe("live reporting leads", () => {
  const a = analyzeEvidence(ELECTION_Q, election);
  const themeId = "phrase:taux-de-participation";
  const pair = suggestTensionPair(election, themeId, a)!;
  const indices = suggestedEvidenceIndices(election, themeId, pair, a);
  const comparison = buildTensionComparison(election, themeId, pair, indices, a)!;
  const t = a.byId[themeId]!;
  const lead: ReportingLead = {
    themeId,
    researchQuestion: ELECTION_Q,
    recordIds: pair,
    evidenceIndices: indices,
    excerptTexts: [comparison.left.evidence.excerpt, comparison.right.evidence.excerpt],
    question: comparison.question,
    theme: { id: t.id, kind: t.kind, label: t.label, terms: t.terms },
  };

  it("defaults to the passages that contain the theme and never claims a disagreement", () => {
    expect(comparisonThemes(election, a)).toContain(themeId);
    expect(indices).toEqual([1, 0]);
    expect(comparison.passageMatches).toEqual([true, true]);
    expect(comparison.interpretation).toBe("research-prompt");
    expect(comparison.reading).toContain("do not establish a disagreement");
  });

  it("survives a reload using only the saved records and snapshot, and exports exact passages", () => {
    const saved = election.filter((r) => pair.includes(r.id));
    const restored = restoreReportingLead(JSON.parse(JSON.stringify(lead)), true)!;
    expect(validReportingLead(restored, ELECTION_Q, saved)).toEqual(lead);
    const brief = generateBrief(ELECTION_Q, saved, restored);
    expect(brief.reportingLead?.question).toBe(comparison.question);
    expect(brief.interpretation?.facets.length).toBeGreaterThan(0);
    const md = briefToMarkdown(brief);
    expect(md).toContain("## How the question was read");
    expect(md).toContain(`cnt_a1, speech, 0:02–0:07: ${election[0]!.evidence[1]!.excerpt}`);
    expect(md).toContain("recurring phrase");
  });

  it("is invalidated when the chosen passage text changes", () => {
    const changed = election.map((r) =>
      r.id === "cnt_b2" ? { ...r, evidence: [{ ...r.evidence[0]!, excerpt: "Texte modifié." }] } : r,
    );
    expect(validReportingLead(lead, ELECTION_Q, changed)).toBeNull();
    expect(generateBrief(ELECTION_Q, changed, lead).reportingLead).toBeNull();
  });

  it("migrates a legacy live lead to an explicit keyword snapshot without losing it", () => {
    const legacy = { ...lead, themeId: "rent-burden" } as Partial<ReportingLead>;
    delete legacy.theme;
    const restored = restoreReportingLead(legacy, true)!;
    expect(restored.theme?.kind).toBe("legacy-keyword");
    expect(restored.theme?.terms).toContain("loyer");
    expect(restoreReportingLead({ ...lead, theme: { id: 1 } }, true)).toBeNull();
    const housing = [
      live("cnt_h1", [speech("Mon loyer est trop cher.", 1, 3)]),
      live("cnt_h2", [speech("Le loyer a encore augmenté.", 4, 6)]),
    ];
    const oldLead: ReportingLead = {
      themeId: "rent-burden",
      researchQuestion: "housing",
      recordIds: ["cnt_h1", "cnt_h2"],
      evidenceIndices: [0, 0],
      excerptTexts: [housing[0]!.evidence[0]!.excerpt, housing[1]!.evidence[0]!.excerpt],
      question: "What explains these rents?",
    };
    const migrated = restoreReportingLead(oldLead, true)!;
    expect(validReportingLead(migrated, "housing", housing)).toEqual(migrated);
    expect(resolveTheme(migrated.theme!, housing).recordIds).toEqual(["cnt_h1", "cnt_h2"]);
  });
});

afterEach(() => localStorage.clear());
