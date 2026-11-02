import { describe, expect, it } from "vitest";
import { RECORDS } from "@/data/records";
import { searchRecords } from "@/lib/search";
import { generateBrief } from "@/lib/brief";
import { emptyFilters } from "@/lib/types";

describe("PARALLAX data rules", () => {
  it("has 45 fictional records, 9 per topic, none with source URLs", () => {
    expect(RECORDS).toHaveLength(45);
    expect(RECORDS.filter((r) => r.topic === "housing")).toHaveLength(9);
    expect(RECORDS.every((r) => r.dataMode === "mock" && r.sourceUrl === null)).toBe(true);
  });

  it("the housing question ranks housing records first", () => {
    const res = searchRecords(RECORDS, "What are French students saying about housing affordability?", emptyFilters);
    expect(res.slice(0, 9).every((r) => r.record.topic === "housing")).toBe(true);
  });

  it("different questions return different results", () => {
    const a = searchRecords(RECORDS, "grocery prices", emptyFilters).map((r) => r.record.id);
    const b = searchRecords(RECORDS, "public transport strike", emptyFilters).map((r) => r.record.id);
    expect(a[0]).not.toBe(b[0]);
  });

  it("brief refuses a contrast when only one perspective is selected", () => {
    const recs = RECORDS.filter((r) => r.perspective === "student").slice(0, 3);
    const brief = generateBrief("q", recs);
    expect(brief.recordCount).toBe(3);
    expect(brief.comparisonNote).toMatch(/cannot support a contrast/);
  });
});
