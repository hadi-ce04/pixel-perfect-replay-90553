import { z } from "zod";
import {
  AI_SYSTEM_PROMPT,
  BRIEF_SCHEMA,
  COMPARE_SCHEMA,
  MAX_BRIEF_PASSAGES,
  MAX_EXCERPT,
  buildBriefPrompt,
  buildComparePrompt,
  finalizeBrief,
  finalizeComparison,
  type AiPassage,
} from "./ai-analysis";

const passageSchema = z.object({
  ref: z.string().regex(/^(A|B|S\d{1,2})$/),
  recordId: z.string().max(120),
  title: z.string().max(400),
  creator: z.string().max(200),
  platform: z.string().max(40),
  publishedAt: z.string().max(40),
  modality: z.string().max(40),
  startSeconds: z.number().finite().nullable(),
  endSeconds: z.number().finite().nullable(),
  excerpt: z.string().min(1).max(MAX_EXCERPT + 4),
});
const inputSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("compare"),
    question: z.string().max(500).default(""),
    passages: z.array(passageSchema).length(2),
  }),
  z.object({
    kind: z.literal("brief"),
    question: z.string().max(500).default(""),
    passages: z.array(passageSchema).min(1).max(MAX_BRIEF_PASSAGES),
  }),
]);

function binding(env: unknown, name: string) {
  const bindings = (env && typeof env === "object" ? env : {}) as Record<string, unknown>;
  const value = bindings[name];
  if (typeof value === "string" && value) return value;
  return typeof process !== "undefined" ? process.env[name] : undefined;
}

export const DEFAULT_MODEL = "gpt-4.1-mini";

export async function handleAnalyze(request: Request, env: unknown) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Cross-origin requests are not supported." }, { status: 403 });
  if (request.method !== "POST") return Response.json({ error: "POST required." }, { status: 405 });
  const key = binding(env, "OPENAI_API_KEY");
  if (!key)
    return Response.json({ error: "AI analysis is not configured on this server." }, { status: 503 });
  const model = binding(env, "OPENAI_MODEL") || DEFAULT_MODEL;
  let input: z.infer<typeof inputSchema>;
  try {
    input = inputSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid analysis request." }, { status: 400 });
  }
  const passages = input.passages as AiPassage[];
  if (new Set(passages.map((p) => p.ref)).size !== passages.length)
    return Response.json({ error: "Invalid analysis request." }, { status: 400 });
  const compare = input.kind === "compare";
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: AI_SYSTEM_PROMPT },
          {
            role: "user",
            content: compare
              ? buildComparePrompt(input.question, passages)
              : buildBriefPrompt(input.question, passages),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: compare ? "passage_comparison" : "evidence_brief",
            strict: true,
            schema: compare ? COMPARE_SCHEMA : BRIEF_SCHEMA,
          },
        },
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      const code = response.status;
      return Response.json(
        {
          error:
            code === 401 || code === 403
              ? "OpenAI rejected the server credential."
              : code === 429
                ? "OpenAI quota or rate limit reached."
                : code === 404 || code === 400
                  ? "OpenAI could not run this analysis with the configured model."
                  : "OpenAI could not complete this analysis.",
        },
        { status: code === 429 ? 429 : 502 },
      );
    }
    const body = await response.json();
    const message = body?.choices?.[0]?.message;
    if (message?.refusal)
      return Response.json({ error: "The model declined to analyse these passages." }, { status: 502 });
    let raw: any;
    try {
      raw = JSON.parse(String(message?.content ?? ""));
    } catch {
      return Response.json({ error: "OpenAI returned an unreadable analysis." }, { status: 502 });
    }
    const usedModel = typeof body?.model === "string" ? body.model : model;
    return Response.json(
      compare
        ? { comparison: finalizeComparison(raw, passages, usedModel) }
        : { brief: finalizeBrief(raw, passages, usedModel) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")
            ? "The AI analysis timed out. Try again."
            : "Could not complete the AI analysis.",
      },
      { status: 502 },
    );
  }
}
