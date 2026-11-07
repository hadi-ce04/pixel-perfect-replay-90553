import { StrictMode, type ReactNode } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { StoreProvider, useStore } from "@/lib/store";
import { emptyFilters } from "@/lib/types";

afterEach(() => {
  cleanup();
  localStorage.clear();
});
const wrapper = ({ children }: { children: ReactNode }) => (
  <StrictMode>
    <StoreProvider>{children}</StoreProvider>
  </StrictMode>
);

it("restores saved evidence, filters and recent searches without overwriting them during hydration", async () => {
  const stored = {
    query: "housing",
    filters: { ...emptyFilters, platforms: ["TikTok"], from: "2026-01-01", to: "2026-01-31" },
    saved: ["HOU-001"],
    recent: [{ query: "housing", at: "2026-11-02T10:00:00Z" }],
  };
  localStorage.setItem("parallax:v1", JSON.stringify(stored));
  const view = renderHook(() => useStore(), { wrapper });
  await waitFor(() => expect(view.result.current.hydrated).toBe(true));
  expect(view.result.current.saved).toEqual(stored.saved);
  expect(view.result.current.filters).toEqual(stored.filters);
  expect(view.result.current.recent).toEqual(stored.recent);
  expect(JSON.parse(localStorage.getItem("parallax:v1")!)).toEqual({
    ...stored,
    reportingLead: null,
  });
  view.unmount();
  const reloaded = renderHook(() => useStore(), { wrapper });
  await waitFor(() => expect(reloaded.result.current.saved).toEqual(stored.saved));
});

it("persists changes for the next mount", async () => {
  const view = renderHook(() => useStore(), { wrapper });
  await waitFor(() => expect(view.result.current.hydrated).toBe(true));
  act(() => {
    view.result.current.toggleSaved("HOU-002");
    view.result.current.runSearch("rent");
  });
  await waitFor(() =>
    expect(JSON.parse(localStorage.getItem("parallax:v1")!).saved).toEqual(["HOU-002"]),
  );
  view.unmount();
  const reloaded = renderHook(() => useStore(), { wrapper });
  await waitFor(() => expect(reloaded.result.current.hydrated).toBe(true));
  expect(reloaded.result.current.saved).toEqual(["HOU-002"]);
  expect(reloaded.result.current.query).toBe("rent");
});

it("keeps saved IDs and a reporting lead with a theme snapshot across reloads", async () => {
  const lead = {
    themeId: "phrase:taux-de-participation",
    researchQuestion: "élections",
    recordIds: ["cnt_a1", "cnt_b2"],
    evidenceIndices: [1, 0],
    excerptTexts: ["a", "b"],
    question: "Q?",
    theme: { id: "phrase:taux-de-participation", kind: "recurring-phrase", label: "taux de participation", terms: ["taux de participation"] },
  };
  localStorage.setItem(
    "parallax:v1",
    JSON.stringify({ query: "élections", filters: emptyFilters, saved: ["cnt_a1", "cnt_b2"], recent: [], reportingLead: lead }),
  );
  const view = renderHook(() => useStore(), { wrapper });
  await waitFor(() => expect(view.result.current.hydrated).toBe(true));
  expect(view.result.current.saved).toEqual(["cnt_a1", "cnt_b2"]);
  expect(view.result.current.reportingLead).toEqual(lead);
  await waitFor(() =>
    expect(JSON.parse(localStorage.getItem("parallax:v1")!).reportingLead.theme.label).toBe("taux de participation"),
  );
});

it("discards a corrupt lead but never the saved evidence IDs", async () => {
  localStorage.setItem(
    "parallax:v1",
    JSON.stringify({ query: "q", saved: ["HOU-001"], reportingLead: { themeId: 4 } }),
  );
  const view = renderHook(() => useStore(), { wrapper });
  await waitFor(() => expect(view.result.current.hydrated).toBe(true));
  expect(view.result.current.saved).toEqual(["HOU-001"]);
  expect(view.result.current.reportingLead).toBeNull();
});
