# Avant Vows — Implementation Plan

## Direction

Premium kinetic-editorial wedding invitation inspired by independent fashion magazines, art books, and folding print matter. It must not resemble the botanical softness of Verdant Vows or the celestial depth of Eternal Orbit.

## Experience

- Mobile-first 320×568, 375×667, and 390×844.
- Opening behaves like a sealed magazine sleeve splitting horizontally.
- Sections enter as paper sheets with perspective/fold transitions.
- Oversized editorial typography, issue numbers, running ticker, asymmetric grids.
- Stationary sound control and numbered navigation rail.
- Four complete presets: Ink Vermilion, Cobalt Butter, Plum Mint, Espresso Blush.
- No default user photos; every photo position is an editable frame.

## Sections

1. Opening Envelope
2. Hero / Cover Story
3. Couple / The People
4. Event / The Date
5. Story / The Timeline
6. Gallery / Contact Sheet
7. Gift / Registry Desk
8. Wishes / Guest Notes
9. Closing / Back Cover

## Required contracts

- Background color/image and per-field typography on every section.
- Hero single image, couple two images, gallery up to four images.
- Maps, downloadable calendar, optional dress-code card.
- Modular first/second bank and QRIS show/hide.
- RSVP posts the selected semantic attendance value.
- Lightbox: close button, backdrop, Escape, arrows, and mobile swipe.
- Audio starts only after opening interaction and responds to global music settings.
- Hidden sections disappear from runtime navigation.
- Dynamic `useContainer` support.

## Validation

- No hard-coded user media.
- No broken `<img>` when an image slot is empty.
- No section/background overflow at 320px.
- Editor, demo, and published routes use identical state behavior.
- Lint, TypeScript, and production build pass.
