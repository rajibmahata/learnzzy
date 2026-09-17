# Learnzzy Playful Wonder

Source: Stitch project `1495487808742926612`, design asset
`assets/d9763c62c3a749b290362bd7535f768d`.

## Validated Tokens

- Font: Plus Jakarta Sans, weights 500, 700, 800.
- Canvas: `#f8f9ff`; warm cream reference: `#fdfbf7`.
- Primary: `#0058be` / `#2170e4`.
- Secondary: `#fea619` / `#ffddb8`.
- Success: `#006947` / `#6ffbbe`.
- Coral/error: `#f43f5e` / `#ffdad6`.
- Agent accent: `#8b5cf6`.
- Ink: `#0d1c2e`; muted ink: `#424754`.
- Structural stroke: `#e7e0d2`.
- Child touch target: 56px minimum, 68px for primary actions.
- Organic radii: 16px default, 32px cards, full pills for actions.

## Validation Notes

The system is implemented through `src/styles/tokens.css`, Tailwind extensions,
and shared CSS primitives in `src/styles/globals.css`. Child screens use tactile
bevels, chunky quest stones, large answer choices, and safe-area navigation.
Parent and admin screens reuse the same palette with calmer data density.

Reference HTML and screenshots are stored beside this file. The app does not
hotlink Stitch-hosted images; the existing local Learnzzy logo is equivalent to
the downloaded brand asset.
