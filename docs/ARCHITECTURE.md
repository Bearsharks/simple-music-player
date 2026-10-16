# Feature architecture

`src/app`: entrypoint, router, global styles and providers.
`src/features/{auth,navigation,playlists,queue,player,search,youtube,overlays}`: owned UI, state and API orchestration.
`src/shared/{ui,model,lib,api}`: reusable primitives, common data contracts, infrastructure.
`src/test`: deterministic fixtures, never production credentials.

Start from the named feature, not a global components folder. Presentation components and connected UI are explicitly separate. Styles stay beside their component. Cross-feature imports must be explicit; shared code must not import feature implementations. Playlist and queue state are split during the modernization phase; do not create a new global state dumping ground.

The server is not part of this repository. Playlist CRUD/auth endpoint compatibility is retained. YouTube API and iframe integration are separate boundaries; tests use mock transport and never modify the user's live playlists.
