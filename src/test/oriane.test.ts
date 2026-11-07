import { afterEach, describe, expect, it, vi } from "vitest";
import {
  normalizeOrianeRecord,
  contentSearchBody,
  matchedFacetKeys,
  planSearchBody,
} from "@/lib/oriane-normalize";
import { planQuery } from "@/lib/query-plan";
import { emptyFilters } from "@/lib/types";
import { handleOriane } from "@/lib/oriane.server";
import { formatDate, formatTime, formatTimeRange } from "@/lib/format";
const raw = {
  id: "cnt_testvideo123",
  platform: "tiktok",
  platformId: "123456789",
  profileHandle: "test.creator",
  title: "Mon loyer étudiant",
  caption: "Un logement et un loyer.",
  publishedAt: "2026-11-07T10:00:00Z",
  thumbnailMediaUrl: "https://example.org/thumb.jpg",
  media: [
    {
      type: "video",
      duration: 61.5,
      transcriptChunks: [
        { text: "Mon loyer est de 700 euros.", startSeconds: 8.25, endSeconds: 13.6 },
        { text: "Je cherche un garant.", startSeconds: 16, endSeconds: 20 },
      ],
      onScreenText: ["700 euros"],
      frames: [],
    },
  ],
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const request = (body: unknown, origin?: string) =>
  new Request("http://localhost/api/oriane", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}) },
    body: JSON.stringify(body),
  });
describe("Oriane live mapping", () => {
  it("preserves exact source passages, decimal timestamps and stable order across searches", () => {
    const a = normalizeOrianeRecord(raw, "housing")!;
    const b = normalizeOrianeRecord(raw, "guarantor")!;
    expect(a.evidence).toEqual(b.evidence);
    expect(a.evidence[0]?.startSeconds).toBe(8.25);
    expect(a.evidence[0]?.excerpt).toBe(raw.media[0]!.transcriptChunks[0]!.text);
    expect(a.sourceUrl).toBe("https://www.tiktok.com/@test.creator/video/123456789");
    expect(a.dataMode).toBe("live");
    expect(a.perspective).toBe("unclassified");
    expect(a.contentType).toBe("Unclassified");
    // No dictionary themes or topic are fabricated at mapping time.
    expect(a.themes).toEqual([]);
    expect(a.topic).toBe("unclassified");
    expect(a.annotationMethod).toBe("evidence-terms");
  });
  it("keeps absent data unknown, and never fabricates times, a speaker stance, or an Instagram URL", () => {
    const value = normalizeOrianeRecord(
      {
        ...raw,
        platform: "instagram",
        media: [{ type: "video", duration: null, transcript: "Un passage sans horodatage." }],
      },
      "",
    )!;
    expect(value.durationSeconds).toBeNull();
    expect(value.evidence[0]?.startSeconds).toBeNull();
    expect(value.sourceUrl).toBeNull();
    expect(value.perspective).toBe("unclassified");
    expect(formatTimeRange(null, null)).toBe("Timing not supplied");
  });
  it("keeps source hashtags exactly and drops non-string values", () => {
    expect(normalizeOrianeRecord({ ...raw, hashtags: ["#Élection", 3, ""] })?.hashtags).toEqual([
      "#Élection",
    ]);
  });
  it("builds named facet groups over speech, OCR and captions with date bounds and ID lookup", () => {
    const body = contentSearchBody("Emmanuel Macron et la réforme des retraites", {
      ...emptyFilters,
      from: "2026-01-01",
      to: "2026-12-31",
    }) as any;
    expect(body.filters).toHaveProperty("publishedAt.before", "2026-12-31");
    const names = body.queries.map((q: any) => q.name);
    expect(names).toEqual(["f0", "f1", "f2"]);
    const macron = body.queries[0];
    expect(macron.filters.transcript.includesExactly.values).toEqual(["Emmanuel Macron"]);
    expect(macron.filters.caption.includesExactly.values).toEqual(["Emmanuel Macron"]);
    expect(macron.filters.onScreenText).toBeDefined();
    expect(body.queries[2].filters.transcript.includesExactly.values).toEqual(
      expect.arrayContaining(["retraites", "pension"]),
    );
    expect(contentSearchBody("", emptyFilters, ["cnt_testvideo123"])).toEqual({
      operator: "and",
      filters: { id: { includes: ["cnt_testvideo123"] } },
    });
    expect(() => contentSearchBody("", emptyFilters)).toThrow();
  });
  it("relaxes only topic words in the broad pass and never sends speaker-context words", () => {
    const plan = planQuery("What are French students saying about housing in Lyon?");
    const strict = planSearchBody(plan, emptyFilters, "strict") as any;
    const broad = planSearchBody(plan, emptyFilters, "broad") as any;
    expect(JSON.stringify(strict)).not.toMatch(/"French"/);
    expect(strict.queries).toHaveLength(3);
    expect(broad.queries[0].filters.transcript.includesExactly.values).toEqual(["Lyon"]);
    expect(broad.queries[1].operator).toBe("or");
    expect(broad.queries[1].queries).toHaveLength(2);
    expect(matchedFacetKeys(plan, ["f1", "f9", 4, "f1"])).toEqual([plan.facets[1]!.key]);
  });
  it("formats real ISO dates and decimal timestamps without invalid dates or decimal second strings", () => {
    expect(formatDate(raw.publishedAt)).toBe("7 Nov 2026");
    expect(formatTime(8.25)).toBe("0:08");
    expect(formatTime(null)).toBe("Time not supplied");
  });
});
describe("Oriane server boundary", () => {
  it("runs a strict then relaxed pass, maps matchedQueries and sends credentials only upstream", async () => {
    const other = { ...raw, id: "cnt_othervideo456" };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json(
          { data: { results: [{ ...raw, matchedQueries: ["f0", "f1"] }] }, metadata: { pagination: { totalCount: 1 } } },
          { status: 206 },
        ),
      )
      .mockResolvedValueOnce(
        Response.json(
          {
            data: { results: [{ ...other, matchedQueries: ["f1"] }, { ...raw, matchedQueries: ["f0", "f1"] }] },
            metadata: { pagination: { totalCount: 100 } },
          },
          { status: 200 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const response = await handleOriane(
      request({ operation: "search", query: "loyer logement", filters: emptyFilters }),
      { ORIANE_API_KEY: "unit-test-secret" },
    );
    const body = await response.json();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("sort=transcriptRelevance");
    const strictBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
    const broadBody = JSON.parse(fetchMock.mock.calls[1]?.[1].body);
    expect(strictBody.queries.map((q: any) => q.name)).toEqual(["f0", "f1"]);
    expect(broadBody.queries[0].operator).toBe("or");
    expect(body.records.map((r: any) => r.id)).toEqual(["cnt_testvideo123", "cnt_othervideo456"]);
    expect(body.facetMatches).toEqual({ cnt_testvideo123: ["loyer", "logement"], cnt_othervideo456: ["logement"] });
    expect(body.matching).toEqual({ strictTotal: 1, broadTotal: 100, strictShown: 1, broadShown: 1 });
    expect(body.plan.question).toBe("loyer logement");
    expect(body.records[0].themes).toEqual([]);
    expect(body.partial).toBe(true);
    expect(body.limited).toBe(true);
    expect(JSON.stringify(body)).not.toContain("unit-test-secret");
    expect(fetchMock.mock.calls[0]?.[1].headers.Authorization).toBe("Bearer unit-test-secret");
  });
  it("skips the relaxed pass when the strict pass fills the page or only one topic word exists", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ data: { results: [raw] }, metadata: { pagination: { totalCount: 1 } } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await handleOriane(request({ operation: "search", query: "Mbappé", filters: emptyFilters }), {
      ORIANE_API_KEY: "k",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("explains a question with no searchable subject and rejects fictional topic filters, without upstream calls", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const empty = await handleOriane(
      request({ operation: "search", query: "What are people saying about it?", filters: emptyFilters }),
      { ORIANE_API_KEY: "k" },
    );
    expect(empty.status).toBe(400);
    expect((await empty.json()).error).toMatch(/quoted phrase/);
    const topic = await handleOriane(
      request({ operation: "search", query: "rent", filters: { ...emptyFilters, topics: ["housing"] } }),
      { ORIANE_API_KEY: "k" },
    );
    expect(topic.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("rejects cross-origin access and invalid IDs before making an upstream call", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(
      (await handleOriane(request({}, "https://other.example"), { ORIANE_API_KEY: "test" })).status,
    ).toBe(403);
    expect(
      (
        await handleOriane(
          request({ operation: "getMany", ids: ["HOU-001"], filters: emptyFilters }),
          { ORIANE_API_KEY: "test" },
        )
      ).status,
    ).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("does not fall back to mock results or leak upstream text on auth or credit failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(Response.json({ secret: "sensitive upstream text" }, { status: 402 })),
    );
    const response = await handleOriane(
      request({ operation: "search", query: "housing", filters: emptyFilters }),
      { ORIANE_API_KEY: "test" },
    );
    const body = await response.json();
    expect(response.status).toBe(502);
    expect(body.error).toContain("credits");
    expect(body.records).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("sensitive upstream text");
  });
});
