# Self-hosted product fonts

The approved stack is Geist Sans for Latin/numerals, then Pretendard Variable for
Hangul, then system fallbacks. `shared/ui/fonts.css` loads both from this repository;
`electric-night.scss` owns the single `--font` token. App and Storybook import the
same CSS. Font-display is swap. No Next.js runtime, CDN, CSP expansion or JS font
loader is used. Existing feature sizes, line heights and tabular time digits stay.

## Pinned upstream assets

- Geist Sans **v1.7.2**, official `vercel/geist-font`,
  `packages/next/dist/fonts/geist-sans/Geist-Variable.woff2` (69,760 bytes).
  Upstream `packages/next/dist/sans.js` specifies normal weight 100–900.
- Pretendard Variable **v1.3.9**, official `orioncactus/pretendard`,
  `packages/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css`
  and all 92 adjacent `woff2-dynamic-subset` files. The upstream CSS is unmodified:
  its normal weight 45–920, swap, unicode ranges and relative URLs are preserved.
  Browsers fetch only the subsets needed by the displayed glyphs, not all 92.
- Both are SIL Open Font License 1.1. The exact pinned licenses are included in
  `public/licenses/fonts/` so Vite ships them with both root and subpath builds.
  `SOURCES.json` records the source URLs, byte sizes and SHA-256 of every binary,
  upstream CSS and distributed license. Font binaries have not been modified.

## Verification and limits

`font-assets.test.ts` checks every recorded hash, WOFF2 header, local CSS URL,
subset count, variable-weight and swap contract. `e2e/typography.mjs` records real
Chromium glyph fonts with CDP (not just computed font-family), same-origin network
loads, 7 widths, mixed titles and 200% text approximation. Existing electric-night
also retains its 1280px and enlarged-text coverage. Font failure keeps a readable
system fallback and usable controls. Actual OS text zoom/mobile Safari needs
separate device checks; simulation is not claimed as those checks.
