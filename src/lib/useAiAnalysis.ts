import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { aiCacheKey, type AiBrief, type AiComparison, type AiPassage } from "./ai-analysis";

type Status = "idle" | "loading" | "error" | "ready";

/** Results survive navigation within a session; nothing runs until the user asks. */
const cache = new Map<string, AiComparison | AiBrief>();

async function analyze(kind: "compare" | "brief", question: string, passages: AiPassage[]) {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, question, passages }),
  });
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    /* handled below */
  }
  if (!response.ok) throw new Error(body?.error ?? "The AI analysis could not be completed.");
  const result = kind === "compare" ? body?.comparison : body?.brief;
  if (!result) throw new Error("Unexpected AI analysis response.");
  return result;
}

function useAi<T extends AiComparison | AiBrief>(
  kind: "compare" | "brief",
  passages: AiPassage[] | null,
  question: string,
) {
  const key = passages?.length ? aiCacheKey(kind, question, passages) : null;
  const [, rerender] = useState(0);
  const mutation = useMutation({
    mutationFn: (vars: { key: string; passages: AiPassage[] }) =>
      analyze(kind, question, vars.passages).then((result) => ({ key: vars.key, result })),
    onSuccess: ({ key: k, result }) => {
      cache.set(k, result);
      rerender((n) => n + 1);
    },
  });
  const cached = key ? ((cache.get(key) as T | undefined) ?? null) : null;
  // Only report loading/error for the passages currently shown.
  const current = mutation.variables?.key === key;
  const status: Status = cached
    ? "ready"
    : current && mutation.isPending
      ? "loading"
      : current && mutation.isError
        ? "error"
        : "idle";
  return {
    result: cached,
    status,
    error: current && mutation.error ? mutation.error.message : null,
    run: () => {
      if (key && passages?.length) mutation.mutate({ key, passages });
    },
  };
}

export function useAiComparison(passages: AiPassage[] | null, question: string) {
  return useAi<AiComparison>("compare", passages, question);
}

export function useAiBrief(passages: AiPassage[], question: string) {
  return useAi<AiBrief>("brief", passages, question);
}

/** Test helper. */
export function clearAiCache() {
  cache.clear();
}
