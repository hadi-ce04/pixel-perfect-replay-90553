import { expect, it } from "vitest";
import { MockProvider } from "@/lib/provider";
import { emptyFilters, type SearchFilters } from "@/lib/types";

it("combines filters and treats both date boundaries as inclusive", async () => {
  const provider = new MockProvider();
  const filters: SearchFilters = {
    ...emptyFilters,
    platforms: ["TikTok"],
    topics: ["housing"],
    contentTypes: ["Testimonial"],
    from: "2026-01-14",
    to: "2026-01-14",
  };
  expect((await provider.search("housing", filters)).map((result) => result.record.id)).toEqual([
    "HOU-001",
  ]);
  expect(
    await provider.search("housing", { ...filters, from: "2026-01-01", to: "2026-01-13" }),
  ).toEqual([]);
  expect(await provider.search("housing", { ...filters, from: "2027-01-01", to: null })).toEqual(
    [],
  );
});
