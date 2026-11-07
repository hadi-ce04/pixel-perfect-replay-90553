# Oriane integration plan for Parallax

Prepared 3 November 2026 from [Oriane's public API reference](https://connect.oriane.xyz/rest/docs), linked from [Oriane's API page](https://www.oriane.xyz/api). Published schema version: `0.0.1`.

This document preserves the original documentation-based plan. The live adapter has since been implemented and authenticated locally. See [live-oriane.md](live-oriane.md) for the verified response shape, configuration, supported behavior, and remaining limitations.

## Confirmed public contract

- API origin: `https://connect.oriane.xyz`.
- Content retrieval: `POST /rest/contents/search`, body schema `SearchContentsRequest.Body`.
- Query parameters include `projection`, `limit`, `offset`, `sort`, and `aiSearchAnchor`.
- Projections are `basic`, `default`, and `full`. The full result includes `media`, whose records expose nullable transcripts, transcript chunks, on-screen text, duration, tags, and frames. Start with `projection=full` for the evidence workflow.
- Pagination allows 1–100 items, defaults to 20, and returns `metadata.pagination`. Preserve `aiSearchAnchor` for later pages of a visual similarity search.
- Responses are wrapped in `data` and `metadata`; documented status codes include 200, 206, 400, 402, 404, 416, and 500. Confirm the operational meaning of non-200 statuses using the event documentation and real responses.
- Documented filters include content ID, platform, format, publication date, caption, transcript, transcript language, on-screen text, and visual similarity. Text matching supports exact and fuzzy operands. Do not describe fuzzy matching as semantic understanding without verification.
- Visual similarity uses a reusable asset ID. `POST /rest/assets` creates text or image assets. A text asset is limited to 300 characters. This is a separate flow from transcript text filtering.

## First search to verify at the event

Use content search with `projection=full&limit=20&offset=0`. The separate `oriane-housing-request.json` is an unexecuted request-body example using documented filters. It searches French housing terms in speech, limits the formats to video and platforms to those Parallax currently supports, and requires French transcript language.

The language restriction may exclude unprocessed records. If the initial result is empty, inspect response metadata and test without the language filter before concluding there is no relevant footage. Keep caption/transcript language separate from the speaker's nationality or location.

## Mapping to the application

| Parallax field | Documented Oriane field | Adapter rule |
|---|---|---|
| `id` | `id` | Preserve the stable content ID. Re-resolve saved IDs using the content ID filter. |
| `platform` | `platform` | Map `tiktok` and `instagram` to the application's current labels. YouTube is documented but not supported by the current UI model. |
| `title` | nullable `title`, nullable `caption` | Use a supplied title or an explicitly truncated caption. Otherwise display an untitled-record label. |
| `description` | nullable `caption` | Preserve source text; do not replace missing descriptions with generated factual claims. |
| `publishedAt` | `publishedAt` | Preserve the source timestamp and agree on date-filter timezone semantics. |
| `creatorLabel` | `profileDisplayName`, `profileHandle` | Prefer the supplied display name and handle. Do not treat profile verification as evidence verification. |
| `thumbnailUrl` | nullable `thumbnailMediaUrl` | Show the source thumbnail when supplied; keep illustrative artwork distinguishable from footage. |
| `durationSeconds` | nullable `media[].duration` | Resolve the selected video media item. Missing duration must display as unknown, not zero. |
| speech evidence | nullable `media[].transcriptChunks[]` | Map `text`, `startSeconds`, and `endSeconds` to an excerpt and its real time range. |
| speech without timing | nullable `media[].transcript` | Preserve the excerpt without inventing a time range. |
| on-screen text | nullable `media[].onScreenText` or `media[].frames[].onScreenTextRegions[].text` | Preserve OCR provenance. Frame regions have a frame `timestampSeconds`, not necessarily a time range. |
| visual evidence | `media[].frames[]`, `media[].tags[]` | A frame URL is an image, not a narrative description. Do not turn it into an invented visual claim. |
| `sourceUrl` | No canonical post URL found in the inspected result schema | Ask for the supported source-link mechanism. Keep null until verified. Numeric Instagram platform IDs are not post shortcodes. |
| `themes`, `topic`, `perspective`, `contentType` | No equivalent editorial annotations found | Derive separately from supplied evidence, record the derivation, and allow unclassified results. Never attach mock relationships to live records. |
| `dataMode` | Set by the adapter | Set `live` only for an actual authenticated source response. Documentation examples remain examples. |

The current application types require duration, both timestamp boundaries, topic, perspective, and editorial content type. Before enabling a live provider, make missing values explicit and update the corresponding UI and brief logic. Multiple media items also require preserving which item an excerpt or frame came from.

## Questions for the organizers

- Which authentication header and credential format does the event use? The inspected OpenAPI specification does not declare a security scheme. Do not guess or place secrets in `VITE_*` variables.
- Is this public API the event's actual contract? Obtain any event-specific schema or SDK.
- Which original-post URL or approved playback mechanism should the app use?
- Which projections and transcript/frame fields are enabled for the event account?
- How do partial responses (206), account credits (402), pagination errors, quotas, and retry guidance work?
- What distinguishes no detected speech/text from media that has not yet been processed?
- What pre-event code is permitted in the final submission?

## Event-day implementation order

1. Confirm the contract, account permissions, authentication, and competition rules.
2. Configure the secret on the server. Keep the browser calling the application's own endpoint, with fixed upstream routes and validated input.
3. Make one controlled full-projection housing search. Capture a redacted response as a test fixture, with source provenance.
4. Adjust the normalized model for missing values, multiple media items, source links, and unclassified editorial fields.
5. Implement `OrianeProvider` behind `SearchProvider`. Confirm `getById`/`getMany` can re-resolve IDs from saved investigations.
6. Map only returned evidence and timestamps. Build editorial relationships from the real evidence, with clear analysis provenance.
7. Replace hardcoded demo labels and fixture artwork throughout the live workspace. Keep the curated landing examples labeled as demonstrations.
8. Run the same search → graph → evidence → save → refresh → brief → export checks against live records.
9. Verify empty, partial, quota, authentication, timeout, and server-error responses without silently falling back to fictional results.
10. Deploy the tested version and verify the hosted investigation flow. The user handles the demo video.

## Success criterion

A real search returns source-grounded records. Evidence excerpts, times, graph connections, saved selections, and exported brief references remain traceable to those records after a refresh. Missing or unprocessed data is explicit. No fabricated creator statements, timestamps, perspectives, or source links fill gaps.
