# Live Oriane integration

Verified locally on 7 November 2026 against an authenticated Oriane response.

## Local configuration

Create an ignored `.env.local` file with `ORIANE_API_KEY` set to the account credential and `VITE_DATA_MODE=live`. The key is server-only; never prefix it with `VITE_`. Restart Vite after changing configuration. To return to fictional examples, set `VITE_DATA_MODE=mock` and restart. Live and mock saved collections use separate localStorage keys.

Production uses the generated Cloudflare server. Configure `ORIANE_API_KEY` as a runtime secret and build with `VITE_DATA_MODE=live`. No deployment was performed by this integration task. Do not publish the credential in source, static hosting configuration, or client bundles. The local endpoint is intended for this local demonstration; add access control and request quotas before exposing shared account credits publicly.

## Implemented contract

The browser calls the same-origin POST `/api/oriane` endpoint. The server validates parameters and uses Bearer authentication against POST `https://connect.oriane.xyz/rest/contents/search?projection=full&limit=25&offset=0&sort=transcriptRelevance` (ID lookups omit the sort). Results come from `data.results`; pagination comes from `metadata.pagination`. ID lookups support saved evidence after reload.

### Open-topic question handling (7 November 2026)

Parallax no longer maps questions onto five preset topics. A pure planner (`src/lib/query-plan.ts`) keeps the full question and extracts facets that are shown to the user on Discover:

- **Anchors** (must match): named entities (capitalised sequences, acronyms, mixed-case names such as ChatGPT), "quoted phrases", #hashtags and @handles.
- **Topic terms**: remaining content words and years. Each carries visible variants with a reason: accent (Oriane exact matching is case-insensitive but accent-sensitive, verified live), plural, or English/French translation from a small vocabulary list (`src/lib/lexicon.ts`). The vocabulary is cross-language wording, not topic categories.
- **Context words** (demonyms, "young people", etc.) are listed but never sent as a constraint: text matches cannot establish who is speaking.
- Platform names in a question become a platform filter when none is set. Years are searched as text and never turned into publication-date filters.

Each searchable facet is sent as a **named Oriane query group**; Oriane returns `matchedQueries` per result, so every record shows which question terms the provider matched. Results are sorted by `transcriptRelevance`. A strict pass requires every facet; only when it returns fewer than 25 records and the question has two or more topic terms does a relaxed pass (anchors + any topic term) fill the page. The UI discloses both counts. This is exact phrase matching with variants, not semantic question understanding. Fuzzy matching (`includesFuzzy`) was measured as far broader with undocumented semantics and is not used. Visual similarity search (text assets) is documented by Oriane but not implemented.

### Evidence-grounded themes

`src/lib/analysis.ts` derives themes from the returned source text only:

- **Question terms**: facets found in a passage, with the exact passage and timestamps.
- **Recurring phrases**: one- to three-word phrases (stopword-trimmed, English and French) appearing in at least two distinct records; label is the source's own wording.
- **Shared hashtags** on at least two records.

Theme IDs are deterministic (`term:`, `phrase:`, `tag:`), so the same analysis is reproduced after reload and in the brief. A reporting question saves a snapshot of its theme definition and is invalidated if either chosen passage changes. A shared term is not a shared claim, stance or disagreement, and the UI says so. Speaker perspectives and content types remain unclassified. Older saved leads that used the previous keyword tags are migrated to a labelled legacy-keyword theme without deleting saved IDs. The fictional catalog themes apply only to mock records.

Real speech chunks retain source text, decimal timestamps and stable evidence order. OCR frame timestamps remain point observations. Missing timing, duration, source links or processing output remain explicit. Long passages in the brief are shortened to an exact contiguous window marked with ellipses. Errors never fall back to mock results. Landing-page illustrations remain explicitly fictional examples.

## Validation

Automated checks cover source mapping, missing values, exact search filters, stable passage order, partial response shape, credential handling, request validation, quota failures and the existing provider/save/brief workflows. Browser checks cover live search, evidence inspection, saving and reloading a real source, and generating the source-based brief.

The supplied account returned HTTP 206 with incomplete evidence coverage. Review original sources and verify claims independently. Original-post URLs are absent for many Instagram records. Hosted runtime credentials, deployment, pagination, advanced relevance, and visual similarity remain future work.

## AI comparison and brief reading (OpenAI)

Story Tensions ("Analyse this pair") and the editorial brief ("Generate AI reading") can call OpenAI through the same-origin `POST /api/analyze` endpoint (`src/lib/ai.server.ts`). The key is server-only: `OPENAI_API_KEY` in `.env.local` locally, and as a runtime secret on the host. `OPENAI_MODEL` overrides the default `gpt-4.1-mini` (GPT-5 reasoning models reject the `temperature` parameter the endpoint sends). Analysis runs only on click.

Grounding rules (`src/lib/ai-analysis.ts`): the model receives only the exact selected passages, marked as untrusted data. Every point must cite a quote that the server verifies verbatim against the passage it names; unverified points are dropped and counted. A "shared" point must cite both passages; a "differ" verdict without a verified difference is downgraded to "unclear". Statements must be attributed to their source, never asserted as fact. Output is labelled AI-generated with model and time, in the UI and in the Markdown export. Verified live on 7 November 2026 with elections and sports pairs: all citations matched their sources.

The public site has no access control, so anyone with the link can spend both Oriane and OpenAI credits.
