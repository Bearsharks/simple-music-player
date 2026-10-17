# Working on Simple Music Player

- Start with `docs/CHANGE-GUIDE.md`, then read only the relevant feature README and its entry files. Use `npm run impact -- <feature>` before changing a contract; expand inspection to listed consumers when needed.
- For UI, copy, and prototype changes, read and follow `DESIGN_SYSTEM.md`, especially its minimal-copy governance. Express behavior through controls and state; keep only necessary task labels, errors, confirmations, accessibility names, and demo disclosures.
- For the YouTube extension bridge, read `extension/README.md` and `src/features/youtube/README.md`. Keep item payloads restricted to kind/id; validate actual message senders and runtime schemas. Playlist resolution belongs to Loopy and iframe results must not be represented as complete source enumeration.
- Update the feature README when entry points, dependencies, invariants or verification commands change. Report remaining coupling and untested behavior explicitly.
- Keep changes within a feature; application wiring belongs in `src/app`, reusable UI and infrastructure in `src/shared`.
- Never log or commit credentials, OAuth tokens or private environment values. Do not run production API mutations during verification.
- Current product restores the original playlist workspace and right-side queue, without sign-in. Preserve URL validation, local persistence, duplicate handling, selection and embedded playback. Playlist modules are mounted and use localAPI; do not re-enable authentication or server storage. Add regression tests for changed behavior.
- Run the documented checks before delivery. Unit tests and fixture previews do not prove live Google login or YouTube playback.
- Keep the latest accepted application code on `main`. Temporary branches are for work in progress only: after verification, integrate changes into `main`; do not leave the deployed product exclusively on a feature or design branch. Build releases from a verified `main` commit and record that SHA. No deployment, account permission changes, backend replacement or force push without explicit approval.
- Keep dependency upgrades separate from structural commits. Record migration decisions and known limitations in docs.
