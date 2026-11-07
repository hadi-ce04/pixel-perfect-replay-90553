import { describe, expect, it } from "vitest";
import { RECORDS } from "@/data/records";
import {
  buildTensionComparison,
  comparisonThemes,
  eligibleTensionRecords,
  suggestTensionPair,
  validReportingLead,
  type ReportingLead,
} from "@/lib/tensions";
import { generateBrief, briefToMarkdown } from "@/lib/brief";

const records = RECORDS.filter((r) => r.topic === "housing");
const ids: [string, string] = ["HOU-002", "HOU-008"];
const comparison = buildTensionComparison(records, "guarantor", ids, [0, 0])!;
const lead: ReportingLead = {
  themeId: "guarantor",
  researchQuestion: "Housing?",
  recordIds: ids,
  evidenceIndices: [0, 0],
  excerptTexts: [comparison.left.evidence.excerpt, comparison.right.evidence.excerpt],
  question: comparison.question,
};

describe("Story Tensions grounding", () => {
  it("suggests distinct records with evidence sharing the selected theme", () => {
    expect(suggestTensionPair(records, "guarantor")).toEqual(ids);
    expect(buildTensionComparison(records, "guarantor", ["HOU-001", "HOU-002"], [0, 0])).toBeNull();
    expect(buildTensionComparison(records, "guarantor", ["HOU-002", "HOU-002"], [0, 0])).toBeNull();
    expect(buildTensionComparison(records, "guarantor", ids, [0, 99])).toBeNull();
  });
  it("does not count duplicate IDs or records without usable excerpts as comparison evidence", () => {
    const record = records.find((r) => r.id === "HOU-002")!;
    const insufficient = [record, record, { ...record, id: "blank", evidence: [] }];
    expect(eligibleTensionRecords(insufficient, "guarantor")).toHaveLength(1);
    expect(comparisonThemes(insufficient)).toEqual([]);
    expect(suggestTensionPair(insufficient, "guarantor")).toBeNull();
  });
  it("uses prepared interpretation only for exact fictional passages", () => {
    expect(comparison.interpretation).toBe("prepared-demo");
    expect(comparison.right.evidence.modality).toBe("on-screen text");
    // Live records never receive the fictional catalog or its prepared readings.
    const live = records.map((r) => ({ ...r, dataMode: "live" as const }));
    expect(buildTensionComparison(live, "guarantor", ids, [0, 0])?.interpretation).not.toBe(
      "prepared-demo",
    );
    const changed = records.map((r) =>
      r.id === "HOU-002"
        ? { ...r, evidence: [{ ...r.evidence[0]!, excerpt: "A changed source passage." }] }
        : r,
    );
    expect(buildTensionComparison(changed, "guarantor", ids, [0, 0])?.interpretation).toBe(
      "research-prompt",
    );
    expect(buildTensionComparison(records, "guarantor", ids, [0, 1])?.interpretation).toBe(
      "research-prompt",
    );
  });
  it("can compare shared perspectives without claiming a contradiction", () => {
    const result = buildTensionComparison(records, "colocation", ["HOU-004", "HOU-005"], [0, 0])!;
    expect(result.differentPerspectives).toBe(false);
    expect(result.interpretation).toBe("research-prompt");
    expect(result.reading).toContain("do not establish a disagreement");
  });
  it("exports the selected passage and time range, rather than substituting the default speech excerpt", () => {
    const brief = generateBrief(
      "Housing?",
      records.filter((r) => ids.includes(r.id)),
      lead,
    );
    expect(brief.reportingLead?.question).toBe(comparison.question);
    expect(brief.tensionExcerpts[1]?.modality).toBe("on-screen text");
    expect(brief.tensionExcerpts[1]?.startSeconds).toBe(5);
    expect(briefToMarkdown(brief)).toContain("HOU-008, on-screen text, 0:05–0:12");
  });
  it("removes an angle from the brief if evidence, selected records or the investigation question changes", () => {
    expect(validReportingLead(lead, "Housing?", records)).toEqual(lead);
    expect(validReportingLead(lead, "Another question", records)).toBeNull();
    expect(
      generateBrief(
        "Housing?",
        records.filter((r) => r.id !== "HOU-002"),
        lead,
      ).reportingLead,
    ).toBeNull();
    const changed = records.map((r) =>
      r.id === "HOU-008"
        ? { ...r, evidence: [{ ...r.evidence[0]!, excerpt: "Updated evidence" }] }
        : r,
    );
    expect(validReportingLead(lead, "Housing?", changed)).toBeNull();
  });
});
