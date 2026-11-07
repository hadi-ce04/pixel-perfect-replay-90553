<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Data access goes through `SearchProvider` (src/lib/provider.ts); `MockProvider` serves fictional fixtures. A live source must be added as a new provider adapter, not by changing UI code.
- Search/filtering (src/lib/search.ts), graph relationships (src/lib/graph.ts) and brief generation (src/lib/brief.ts) stay in separate pure modules so they can be unit-tested.
- Client state (query, filters, saved evidence, recent searches) lives in `StoreProvider` and persists to localStorage; no backend in this version.
- Presentation is shared through semantic CSS tokens and the Button component; editorial layouts must not change provider, search, graph relationship, store or brief logic.
- Cover imagery is bundled locally and explicitly labeled as editorial illustration, never source footage; global semantic tokens control the light presentation across screens.
