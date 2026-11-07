import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StoryTensions } from "@/components/parallax/StoryTensions";
import { StoreProvider, useStore } from "@/lib/store";
import { RECORDS } from "@/data/records";
import { generateBrief } from "@/lib/brief";

const records = RECORDS.filter((r) => r.topic === "housing");
afterEach(() => {
  cleanup();
  localStorage.clear();
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
  <StoreProvider>
    {children}
    <State />
  </StoreProvider>
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
