import { z } from "zod";
import {
  SEARCH_LIMIT,
  contentSearchBody,
  hasBroadPass,
  matchedFacetKeys,
  normalizeOrianeRecord,
  planSearchBody,
} from "./oriane-normalize";
import { planQuery, searchableFacets } from "./query-plan";
import type { SearchFilters, VideoRecord } from "./types";

const filtersSchema = z.object({
  platforms: z.array(z.enum(["TikTok", "Instagram", "YouTube"])).max(3),
  topics: z.array(z.string().max(40)).max(10),
  contentTypes: z.array(z.string()).max(8),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
});
const inputSchema = z.object({
  operation: z.enum(["search", "getMany"]),
  query: z.string().max(500).default(""),
  ids: z
    .array(z.string().regex(/^cnt_[a-zA-Z0-9]+$/))
    .max(100)
    .optional(),
  filters: filtersSchema,
});

class UpstreamError extends Error {
  constructor(readonly status: number) {
    super("upstream");
  }
}

const UPSTREAM = "https://connect.oriane.xyz/rest/contents/search";

async function upstream(key: string, body: unknown, sort?: string) {
  const qs = new URLSearchParams({
    projection: "full",
    limit: String(SEARCH_LIMIT),
    offset: "0",
    ...(sort ? { sort } : {}),
  });
  const response = await fetch(`${UPSTREAM}?${qs}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new UpstreamError(response.status);
  const json = await response.json();
  if (!Array.isArray(json?.data?.results)) throw new UpstreamError(-1);
  return {
    results: json.data.results as Record<string, unknown>[],
    partial: response.status === 206,
    total: Number(json.metadata?.pagination?.totalCount ?? json.data.results.length) || 0,
  };
}

function upstreamMessage(code: number) {
  if (code === -1) return { error: "Oriane returned an unexpected response format.", status: 502 };
  return {
    error:
      code === 401 || code === 403
        ? "Oriane rejected the server credential."
        : code === 402
          ? "Oriane account credits or access are insufficient."
          : code === 429
            ? "Oriane rate limit reached. Please retry shortly."
            : "Oriane could not complete this request.",
    status: code === 429 ? 429 : 502,
  };
}

export async function handleOriane(request: Request, env: unknown) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Cross-origin requests are not supported." }, { status: 403 });
  if (request.method !== "POST") return Response.json({ error: "POST required." }, { status: 405 });
  const bindings = (env && typeof env === "object" ? env : {}) as Record<string, unknown>;
  const key =
    typeof bindings["ORIANE_API_KEY"] === "string"
      ? bindings["ORIANE_API_KEY"]
      : typeof process !== "undefined"
        ? process.env["ORIANE_API_KEY"]
        : undefined;
  if (!key)
    return Response.json({ error: "Oriane is not configured on this server." }, { status: 503 });
  try {
    const input = inputSchema.parse(await request.json());
    const filters = input.filters as SearchFilters;

    if (input.operation === "getMany") {
      if (!input.ids?.length) return Response.json({ records: [], partial: false, totalCount: 0 });
      let partial = false;
      const records: VideoRecord[] = [];
      for (let i = 0; i < input.ids.length; i += SEARCH_LIMIT) {
        const ids = input.ids.slice(i, i + SEARCH_LIMIT);
        const page = await upstream(key, contentSearchBody("", filters, ids));
        partial ||= page.partial;
        for (const raw of page.results) {
          const record = normalizeOrianeRecord(raw);
          if (record && ids.includes(record.id)) records.push(record);
        }
      }
      return Response.json(
        { records, partial, totalCount: records.length, annotationMethod: "evidence-terms" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    if (filters.contentTypes.length)
      return Response.json(
        {
          error:
            "Live videos have no verified editorial content-type labels. Clear the content-type filter.",
        },
        { status: 400 },
      );
    if (filters.topics.length)
      return Response.json(
        {
          error:
            "Topic filters apply only to the fictional examples. Clear them to search live sources.",
        },
        { status: 400 },
      );

    const plan = planQuery(input.query);
    if (!searchableFacets(plan).length)
      return Response.json(
        {
          error:
            'Parallax could not find a subject to search in this question. Add a name, place, topic word or a "quoted phrase".',
          plan,
        },
        { status: 400 },
      );

    const sort = "transcriptRelevance";
    const strict = await upstream(key, planSearchBody(plan, filters, "strict"), sort);
    const facetMatches: Record<string, string[]> = {};
    const records: VideoRecord[] = [];
    const add = (raw: Record<string, unknown>) => {
      const record = normalizeOrianeRecord(raw);
      if (!record || facetMatches[record.id]) return false;
      facetMatches[record.id] = matchedFacetKeys(plan, raw["matchedQueries"]);
      records.push(record);
      return true;
    };
    strict.results.forEach(add);
    const strictShown = records.length;

    let broad: Awaited<ReturnType<typeof upstream>> | null = null;
    if (hasBroadPass(plan) && strictShown < SEARCH_LIMIT) {
      broad = await upstream(key, planSearchBody(plan, filters, "broad"), sort);
      const extra = broad.results
        .map((raw, order) => ({ raw, order, n: matchedFacetKeys(plan, raw["matchedQueries"]).length }))
        .sort((a, b) => b.n - a.n || a.order - b.order);
      for (const { raw } of extra) {
        if (records.length >= SEARCH_LIMIT) break;
        add(raw);
      }
    }
    const totalCount = broad ? Math.max(broad.total, strict.total) : strict.total;
    return Response.json(
      {
        records,
        partial: strict.partial || !!broad?.partial,
        totalCount,
        limited: totalCount > records.length,
        plan,
        matching: {
          strictTotal: strict.total,
          broadTotal: broad ? broad.total : null,
          strictShown,
          broadShown: records.length - strictShown,
        },
        facetMatches,
        annotationMethod: "evidence-terms",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof UpstreamError) {
      const { error: message, status } = upstreamMessage(error.status);
      return Response.json({ error: message }, { status });
    }
    return Response.json(
      {
        error:
          error instanceof z.ZodError
            ? "Invalid search parameters."
            : error instanceof Error &&
                (error.name === "TimeoutError" || error.name === "AbortError")
              ? "Oriane timed out. Try a narrower search."
              : "Could not load Oriane evidence.",
      },
      { status: error instanceof z.ZodError ? 400 : 502 },
    );
  }
}
