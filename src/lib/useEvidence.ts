import { useQuery } from "@tanstack/react-query";
import { providerIdentity, useSearchProvider } from "./provider-context";
import type { VideoRecord } from "./types";

const EMPTY_RECORDS: VideoRecord[] = [];

export function useEvidenceRecord(id: string | null) {
  const source = useSearchProvider();
  return useQuery({
    queryKey: ["evidence-record", providerIdentity(source), id],
    queryFn: () => source.getById(id!),
    enabled: id !== null,
    retry: false,
    staleTime: 60000,
  });
}

export function useEvidenceCollection(ids: string[], enabled = true) {
  const source = useSearchProvider();
  const uniqueIds = [...new Set(ids)];
  const result = useQuery({
    queryKey: ["evidence-collection", providerIdentity(source), uniqueIds],
    queryFn: async () => {
      if (uniqueIds.length === 0) return EMPTY_RECORDS;
      const received = await source.getMany(uniqueIds);
      const byId = new Map(received.map((record) => [record.id, record]));
      // Keep selection order, and exclude records the user did not request.
      return uniqueIds.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
    },
    enabled,
    retry: false,
    staleTime: 60000,
  });
  const records = result.data ?? EMPTY_RECORDS;
  const receivedIds = new Set(records.map((record) => record.id));
  return {
    ...result,
    records,
    missingIds: result.isSuccess ? uniqueIds.filter((id) => !receivedIds.has(id)) : [],
  };
}
