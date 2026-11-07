# Provider integration and verification

The workspace now supports `OrianeProvider` with server-side credentials. See [live-oriane.md](live-oriane.md) for current configuration and validation. The notes below describe the original provider-boundary checks.

## Installing a future adapter

Implement `SearchProvider` in `src/lib/provider.ts`, using the application's normalized `VideoRecord` schema. Either replace the default `provider` export, or wrap the workspace in `SearchProviderBoundary` with a stable adapter instance. Search, individual evidence, saved collections, and brief inputs all resolve through the same adapter.

- `search(query, filters)` returns normalized search results.
- `getById(id)` resolves a saved/search reference, or returns `null` when unavailable.
- `getMany(ids)` resolves selected references. Missing records may be omitted. The client preserves selection order, excludes unsolicited records, and reports missing IDs.
- `all()` remains part of the contract for dataset-level features.

An adapter must support re-resolving saved IDs across reloads. Cache keys are isolated by adapter instance. Failed collection requests block briefing/export rather than producing an empty or partial brief. Successfully resolved partial collections explicitly list unavailable IDs in the UI and Markdown export.

The landing page's illustrated investigations and overview counts are deliberately curated demo content. Connecting a live adapter does not turn those static examples into live analytics. Live integration should also review all global mode labels and result previews against the actual available API fields.

## Validation completed

- Combined platform, topic, content-type and date filtering returned the expected housing record.
- Story DNA theme selection revealed its five underlying records; graph/list switching worked.
- Saved records survived a full browser refresh after fixing the hydration persistence lifecycle.
- Brief coverage and perspectives reflected the selected records.
- Markdown downloaded successfully with selected IDs, timestamps, and the fictional-data notice. An unselected ID was absent.
- Copy brief displayed its success confirmation.
- Automated tests cover provider-only records, missing and unsolicited records, retry after failure, request races, adapter cache isolation, the real evidence panel, and persistence under StrictMode.

## Still dependent on Oriane access

Actual response mapping, authentication, source provenance, evidence availability, rate limits, and error handling must be verified against the supplied Oriane documentation. Existing tests use a controlled asynchronous source to verify the provider boundary; they do not establish compatibility with an undocumented API.
