# Feature architecture

`src/app`: entrypoint, router, global styles and providers.
`src/features/{auth,navigation,playlists,queue,player,search,youtube,overlays}`: owned UI, state and API orchestration.
`src/shared/{ui,model,lib,api}`: reusable primitives, common data contracts, infrastructure.
`src/test`: deterministic fixtures, never production credentials.

Start from the named feature, not a global components folder. Presentation components and connected UI are explicitly separate. Styles stay beside their component. Cross-feature imports must be explicit; shared code must not import feature implementations. Playlist state lives in features/playlists/model, queue state in features/queue/model, and playback status in features/player/model; do not create a new global state dumping ground.

The server is not part of this repository. Playlist CRUD/auth endpoint compatibility is retained. YouTube API and iframe integration are separate boundaries; tests use mock transport and never modify the user's live playlists.


## Runtime and test contracts

- React 19 + Jotai Provider; Vite builds the client SPA, no SSR/server framework is required.
- Async playlist atoms load lazily, never at module import. Queue items and current index commit through one state value.
- Shared API adapters retain the existing endpoint contract. `VITE_API_MODE=fixture` is explicit test/demo data; normal mode needs `VITE_API_URL`.
- Registration/auth credentials are not configured by agents. `.env*` historically tracked by this repository are not copied into new public configuration. Use `.env.example` with nonsecret URLs only.
- `features/player/api/iframe.ts` owns script loading; the remaining legacy global player access is a documented follow-up, not a second state store.
- Run `npm run check` after each change. Vitest mocks validate behavior; browser rendering, real login and YouTube playback require separate evidence.
- `docs/IMPROVEMENT-PLAN.md` is the prioritized follow-up plan. Do not silently execute optional backend replacement or product redesign from that backlog.

## Change discovery

Use [CHANGE-GUIDE.md](CHANGE-GUIDE.md) and `npm run impact -- <feature>` to narrow inspection. Feature READMEs contain entry files, contract invariants, consumers, targeted tests and explicit gaps. Folder boundaries do not yet eliminate cross-feature deep imports or cyclic feature-level dependencies.
