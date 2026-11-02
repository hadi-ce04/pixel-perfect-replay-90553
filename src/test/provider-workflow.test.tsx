import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { SearchProviderBoundary } from "@/lib/provider-context";
import type { SearchProvider } from "@/lib/provider";
import type { VideoRecord } from "@/lib/types";
import { useEvidenceCollection, useEvidenceRecord } from "@/lib/useEvidence";
import { useResults } from "@/lib/useResults";
import { StoreProvider, useStore } from "@/lib/store";
import { EvidencePanel } from "@/components/parallax/EvidencePanel";
import { briefToMarkdown, generateBrief } from "@/lib/brief";
import { RECORDS } from "@/data/records";

const sourceRecord: VideoRecord = {
  ...RECORDS[0]!,
  id: "source-only",
  title: "A source outside the fixture dataset",
  dataMode: "live",
  sourceUrl: "https://example.org/video/1",
};
function source(overrides: Partial<SearchProvider> = {}): SearchProvider {
  return {
    mode: "live",
    search: vi
      .fn()
      .mockResolvedValue([
        { record: sourceRecord, score: 1, matchedExcerpt: sourceRecord.evidence[0] },
      ]),
    getById: vi.fn().mockResolvedValue(sourceRecord),
    getMany: vi.fn().mockResolvedValue([sourceRecord]),
    all: vi.fn().mockResolvedValue([sourceRecord]),
    ...overrides,
  };
}
function wrapperFor(adapter: SearchProvider) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <SearchProviderBoundary source={adapter}>
          <StoreProvider>{children}</StoreProvider>
        </SearchProviderBoundary>
      </QueryClientProvider>
    );
  };
}
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("provider-backed investigation", () => {
  it("uses the injected source for search and evidence, including records absent from fixtures", async () => {
    const adapter = source();
    const { result } = renderHook(
      () => ({ search: useResults(), record: useEvidenceRecord("source-only") }),
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() => expect(result.current.search.status).toBe("ready"));
    await waitFor(() => expect(result.current.record.data?.id).toBe("source-only"));
    expect(adapter.search).toHaveBeenCalled();
    expect(adapter.getById).toHaveBeenCalledWith("source-only");
  });

  it("keeps saved order, identifies missing records, and excludes unsolicited records from the brief", async () => {
    const second = { ...sourceRecord, id: "second" };
    const adapter = source({
      getMany: vi
        .fn()
        .mockResolvedValue([second, { ...sourceRecord, id: "unrequested" }, sourceRecord]),
    });
    const { result } = renderHook(
      () => useEvidenceCollection(["source-only", "missing", "second", "source-only"]),
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.records.map((r) => r.id)).toEqual(["source-only", "second"]);
    expect(result.current.missingIds).toEqual(["missing"]);
    const brief = generateBrief("Test investigation", result.current.records);
    expect(brief.recordCount).toBe(2);
    expect(brief.excerpts.map((r) => r.recordId)).toEqual(["second", "source-only"]);
    expect(brief.dataMode).toBe("live");
    expect(briefToMarkdown(brief)).not.toContain("Based on fictional");
  });

  it("never displays a slower old record after the selection changes", async () => {
    let finishOld!: (record: VideoRecord) => void;
    const old = new Promise<VideoRecord>((resolve) => {
      finishOld = resolve;
    });
    const adapter = source({
      getById: vi.fn((id: string) => (id === "old" ? old : Promise.resolve(sourceRecord))),
    });
    const { result, rerender } = renderHook(({ id }) => useEvidenceRecord(id), {
      initialProps: { id: "old" },
      wrapper: wrapperFor(adapter),
    });
    rerender({ id: "source-only" });
    await waitFor(() => expect(result.current.data?.id).toBe("source-only"));
    await act(async () => {
      finishOld({ ...sourceRecord, id: "old" });
      await old;
    });
    expect(result.current.data?.id).toBe("source-only");
  });

  it("reports source failures and permits retry without losing the selection", async () => {
    const getMany = vi
      .fn()
      .mockRejectedValueOnce(new Error("Temporary outage"))
      .mockResolvedValueOnce([sourceRecord]);
    const { result } = renderHook(() => useEvidenceCollection(["source-only"]), {
      wrapper: wrapperFor(source({ getMany })),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.missingIds).toEqual([]);
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.records).toEqual([sourceRecord]));
  });

  it("isolates the cache when switching providers with the same mode", async () => {
    const first = source();
    const second = source({
      getById: vi.fn().mockResolvedValue({ ...sourceRecord, title: "Second source" }),
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    function Reader({ adapter }: { adapter: SearchProvider }) {
      return (
        <SearchProviderBoundary source={adapter}>
          <RecordTitle />
        </SearchProviderBoundary>
      );
    }
    function RecordTitle() {
      const record = useEvidenceRecord("source-only");
      return <p>{record.data?.title ?? "Loading"}</p>;
    }
    const view = render(
      <QueryClientProvider client={client}>
        <Reader adapter={first} />
      </QueryClientProvider>,
    );
    await screen.findByText(sourceRecord.title);
    view.rerender(
      <QueryClientProvider client={client}>
        <Reader adapter={second} />
      </QueryClientProvider>,
    );
    await screen.findByText("Second source");
    expect(second.getById).toHaveBeenCalledWith("source-only");
  });

  it("opens source-only records in the actual evidence panel and shows a missing-record state", async () => {
    function OpenRecord() {
      const { openRecord } = useStore();
      return (
        <>
          <button onClick={() => openRecord("source-only")}>Open test record</button>
          <button onClick={() => openRecord("missing")}>Open missing</button>
          <EvidencePanel />
        </>
      );
    }
    const adapter = source({
      getById: vi.fn((id: string) => Promise.resolve(id === "missing" ? null : sourceRecord)),
    });
    render(<OpenRecord />, { wrapper: wrapperFor(adapter) });
    fireEvent.click(screen.getByRole("button", { name: "Open test record" }));
    await screen.findByRole("heading", { name: sourceRecord.title });
    expect(screen.getByText("Source record")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Close$/ }));
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: sourceRecord.title })).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Open missing" }));
    await screen.findByRole("heading", { name: "Evidence unavailable" });
  });
});
