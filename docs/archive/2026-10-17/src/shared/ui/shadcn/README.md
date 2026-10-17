# loopy's adopted shadcn/ui primitives

These seven components are adapted from the official **Radix** `new-york-v4`
registry, fetched 2026-10-16. They are actual shadcn source components, not a
visual substitute for a native select. Original registry snapshots, SHA-256
checksums and MIT license are in `docs/vendor/shadcn/`.

Upstream registry: `https://ui.shadcn.com/r/styles/new-york-v4/{name}.json`
for button, input, textarea, label, select, dropdown-menu and popover.

References:

- https://ui.shadcn.com/docs/components/radix/select
- https://ui.shadcn.com/docs/components/radix/dropdown-menu
- https://ui.shadcn.com/docs/components/radix/popover
- https://ui.shadcn.com/docs/installation/manual
- https://tailwindcss.com/docs/preflight#disabling-preflight

## Local adaptations

- Keep the upstream Radix composition, state/data attributes and props/ref
  forwarding. Import only the used `@radix-ui/react-*` packages, rather than
  the whole `radix-ui` umbrella. Dependencies are exact in the lockfile.
- `shared/lib/cn` uses the standard clsx/tailwind-merge composition with the
  `ui` prefix. All utility classes are prefixed; source discovery is limited
  to this folder. Vite and Storybook share the same utility pipeline.
- No Tailwind Preflight. Existing application/feature SCSS remains responsible
  for layout. `.loopy-control[data-slot]` provides the explicit compatibility
  boundary for product colors, 44px controls, native disabled state and sky
  focus rings. Existing `--muted` remains text, never a surface color.
- Select uses popper placement and captures its actual trigger's native-dialog
  scope on open. It, DropdownMenu and Popover Content expose `portalContainer` for a
  stable native top-layer target and collision boundary. No nonexistent Select
  modal prop is added. Dropdown and Popover users inside this app use `modal={false}`.
- The overlays feature owns the adapter to the existing imperative popup API.
  `ExternalMenuTrigger` exposes the original invoking button ref to Radix,
  without reparenting, duplicating, or replacing that button. Feature actions,
  save failures, busy guards and deleted-row focus fallback stay feature-owned.
- A `data-loopy-button` marker keeps Button styling when a Radix `asChild` trigger
  supplies its own data-slot. The compatibility boundary explicitly resets border
  width to zero; only controls and popup surfaces receive a 1px border.
- Native Dialog, player sheet, Notice/ErrorToast, Tabs, range and media lifetime
  are **not** replaced by shadcn. This source adoption does not claim otherwise.

Before delivery run `npm run check`, `npm run build-storybook` and the browser
suite. jsdom tests do not verify top-layer hit testing, real media or Safari.
Do not run an unreviewed CLI overwrite: local scope/focus adaptations are required.

`data-dialog-popover` marks the inner Escape owner for Dialog fallback behavior.
The native browser path leaves Escape to Radix/native close watchers. Volume's
feature adapter leaves focus in place on hover/trigger focus and enters its existing
range only on keyboard intent; no new range implementation or media player is introduced. Semantic layers live in `electric-night.scss` and
the root `DESIGN_SYSTEM.md`, not independent feature-specific z-index numbers.

`shared/ui/BrandPrimaryButton` is the approved thin composition of Button for the
library New Playlist entry and whole-playlist play only. It forwards native refs,
asChild and disabled behavior, and consumes the shared signature state/color/stop
tokens. Form submits, card/dock circular play and ordinary Button remain solid.
The logo uses the separate shared `--logo-gradient` role token and one continuous
25×28 background coordinate. Its approved compact palette is independent from
CTA stop distribution; component styles never duplicate gradient colors.
