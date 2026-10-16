# Working on Simple Music Player

- Start with `docs/CHANGE-GUIDE.md`, then read only the relevant feature README and its entry files. Use `npm run impact -- <feature>` before changing a contract; expand inspection to listed consumers when needed.
- Update the feature README when entry points, dependencies, invariants or verification commands change. Report remaining coupling and untested behavior explicitly.
- Keep changes within a feature; application wiring belongs in `src/app`, reusable UI and infrastructure in `src/shared`.
- Never log or commit credentials, OAuth tokens or private environment values. Do not run production API mutations during verification.
- Current product is the login-free URL library. Preserve URL validation, local persistence, duplicate handling, selection and embedded playback. Previous editing modules remain reusable but are not mounted; do not re-enable authentication or server storage. Add regression tests for changed behavior.
- Run the documented checks before delivery. Unit tests and fixture previews do not prove live Google login or YouTube playback.
- Use a separate branch. No deployment, account permission changes, backend replacement or force push without explicit approval.
- Keep dependency upgrades separate from structural commits. Record migration decisions and known limitations in docs.
