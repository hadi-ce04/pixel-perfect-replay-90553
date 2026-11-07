import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StoryTensions } from "@/components/parallax/StoryTensions";
import { StoreProvider, useStore } from "@/lib/store";
import { RECORDS } from "@/data/records";
import { generateBrief } from "@/lib/brief";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { clearAiCache } from "@/lib/useAiAnalysis";
import type { AiComparison } from "@/lib/ai-analysis";

const records = RECORDS.filter((r) => r.topic === "housing");
afterEach(() => {
  cleanup();
  localStorage.clear();
  clearAiCache();
  vi.unstubAllGlobals();
});
function State() {
  const s = useStore();
  const brief = generateBrief(
    s.query,
    records.filter((r) => s.saved.includes(r.id)),
    s.reportingLead,
  );
  return (
    <>
      <output aria-label="Saved record count">{s.saved.length}</output>
      <output aria-label="Selected lead">{brief.reportingLead?.question ?? "No angle"}</output>
      <output aria-label="Open evidence">{s.openId ?? "Closed"}</output>
    </>
  );
}
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
    <StoreProvider>
      {children}
      <State />
    </StoreProvider>
  </QueryClientProvider>
);

describe("Story Tensions workbench", () => {
  it("shows exact excerpts and lets a journalist inspect context or change the selected passage", () => {
    render(<StoryTensions records={records} onOpenBrief={() => {}} />, { wrapper });
    expect(screen.getByText("Prepared demo interpretation")).toBeInTheDocument();
    expect(
      screen.getByText(/A public guarantee scheme exists for students without a guarantor/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Inspect evidence B" }));
    expect(screen.getByLabelText("Open evidence")).toHaveTextContent("HOU-008");
    fireEvent.change(screen.getByRole("combobox", { name: "Excerpt B" }), {
      target: { value: "1" },
    });
    expect(screen.getByText("Comparison prompt")).toBeInTheDocument();
    expect(
      screen.getByText(/Many students don't know the public guarantee exists/),
    ).toBeInTheDocument();
  });
  it("saves both sources with the reporting question and withdraws the angle when a source is removed", async () => {
    const openBrief = vi.fn();
    render(<StoryTensions records={records} onOpenBrief={openBrief} />, { wrapper });
    fireEvent.click(screen.getByRole("button", { name: "Use this reporting question" }));
    await waitFor(() => expect(screen.getByLabelText("Saved record count")).toHaveTextContent("2"));
    expect(screen.getByLabelText("Selected lead")).toHaveTextContent(
      "Why can students still face guarantor barriers",
    );
    const stored = JSON.parse(localStorage.getItem("parallax:v1")!);
    expect(stored.reportingLead.evidenceIndices).toEqual([0, 0]);
    expect(stored.saved).toEqual(["HOU-002", "HOU-008"]);
    fireEvent.click(screen.getByRole("button", { name: "Open editorial brief" }));
    expect(openBrief).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Remove HOU-002 from saved evidence" }));
    expect(screen.getByLabelText("Selected lead")).toHaveTextContent("No angle");
    expect(JSON.parse(localStorage.getItem("parallax:v1")!).reportingLead).toBeNull();
    expect(screen.getByRole("button", { name: "Use this reporting question" })).toBeInTheDocument();
  });
  it("does not leave filtered-out evidence or its interpretation in the workbench", () => {
    const view = render(<StoryTensions records={records} onOpenBrief={() => {}} />, { wrapper });
    fireEvent.change(screen.getByRole("combobox", { name: "Comparison theme" }), {
      target: { value: "colocation" },
    });
    expect(screen.getByRole("combobox", { name: "Source A" })).toHaveValue("HOU-004");
    expect(screen.queryByText("Prepared demo interpretation")).not.toBeInTheDocument();
    view.rerender(<StoryTensions records={records.slice(0, 1)} onOpenBrief={() => {}} />);
    expect(screen.getByText("Start with two connected records.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Use this reporting question" }),
    ).not.toBeInTheDocument();
  });
});

const GUARANTOR_QUOTE = "Without a guarantor earning three times the rent";
const aiResult: AiComparison = {
  relationship: "different-scope",
  summary: "A describes a landlord's screening rule; B points to a public guarantee scheme.",
  points: [
    {
      kind: "difference",
      text: "A describes a requirement landlords apply; B describes support that exists.",
      citations: [
        { ref: "A", quote: GUARANTOR_QUOTE },
        { ref: "B", quote: "A public guarantee scheme exists" },
      ],
    },
  ],
  caveats: ["Neither passage says whether the landlord in A accepts the public guarantee."],
  reportingQuestions: ["Do landlords accept the public guarantee in place of a personal guarantor?"],
  model: "test-model",
  generatedAt: "2026-11-07T12:00:00Z",
  droppedPoints: 1,
};

describe("AI comparison in Story Tensions", () => {
  it("compares the selected pair on request, shows cited quotes, and saves a suggested question", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ comparison: aiResult }));
    vi.stubGlobal("fetch", fetchMock);
    render(<StoryTensions records={records} onOpenBrief={() => {}} />, { wrapper });
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Analyse this pair" }));
    expect(
      await screen.findByText("The two passages cover different scopes, so they do not directly contradict."),
    ).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/analyze");
    const sent = JSON.parse(init.body);
    expect(sent.kind).toBe("compare");
    expect(sent.passages.map((p: { ref: string; recordId: string }) => [p.ref, p.recordId])).toEqual([
      ["A", "HOU-002"],
      ["B", "HOU-008"],
    ]);
    expect(screen.getByText(`“${GUARANTOR_QUOTE}”`)).toBeInTheDocument();
    expect(screen.getByText(/1 point was removed because the quoted words were not found/)).toBeInTheDocument();
    expect(screen.getByText(/AI-generated/)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Use reporting question: Do landlords accept the public guarantee in place of a personal guarantor?",
      }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Selected lead")).toHaveTextContent(
        "Do landlords accept the public guarantee in place of a personal guarantor?",
      ),
    );
    const stored = JSON.parse(localStorage.getItem("parallax:v1")!);
    expect(stored.saved).toEqual(["HOU-002", "HOU-008"]);
    expect(stored.reportingLead.ai.relationship).toBe("different-scope");
  });

  it("shows the server's error and lets the journalist retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ error: "OpenAI quota or rate limit reached." }, { status: 429 }))
      .mockResolvedValueOnce(Response.json({ comparison: aiResult }));
    vi.stubGlobal("fetch", fetchMock);
    render(<StoryTensions records={records} onOpenBrief={() => {}} />, { wrapper });
    fireEvent.click(screen.getByRole("button", { name: "Analyse this pair" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("OpenAI quota or rate limit reached.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText(`“${GUARANTOR_QUOTE}”`)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
