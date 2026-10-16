# Working on Simple Music Player

- Read `docs/ARCHITECTURE.md` and the relevant feature README first.
- Keep changes within a feature; application wiring belongs in `src/app`, reusable UI and infrastructure in `src/shared`.
- Never log or commit credentials, OAuth tokens or private environment values. Do not run production API mutations during verification.
- Preserve playlist CRUD, import/search, queue reorder/selection, player controls and routing. Add regression tests for changed behavior.
- Run the documented checks before delivery. Unit tests and fixture previews do not prove live Google login or YouTube playback.
- Use a separate branch. No deployment, account permission changes, backend replacement or force push without explicit approval.
- Keep dependency upgrades separate from structural commits. Record migration decisions and known limitations in docs.
