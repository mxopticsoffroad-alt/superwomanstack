# Section-by-section reference

Every section = **markup** in `src/body.html` · **style** in `src/styles/sections/<name>.css` · **behaviour** in `src/js/sections/<name>.js`. All are wired in `src/app.js`. In Squarespace they all ship in the one embed bundle (see `docs/SQUARESPACE.md`).

Test everything locally: `npm i && npm run dev` → http://localhost:5173. Useful URL flags: `?webgl=0` (static-product fallback), OS "reduce motion" setting, DevTools device mode for mobile.

---
## Nav
- **FILES** `sections/nav.{css,js}`
- **WHERE** body.html `<header data-nav>`; config `links.*` sets destinations.
- **WHAT** Glass pill nav; hides on scroll-down/reveals on scroll-up; mobile full-screen menu; smooth in-page anchors; cart badge listens to `sws:cart`.
- **ASSETS** none. **TEST** scroll down (nav hides) / up (returns); resize <900px → burger; Esc closes; Tab order.

## Hero
- **FILES** `hero.{css,js}`, `gl/experience.js` (pose), `core/motion.js`
- **WHERE** `#top`. Product slot `[data-hero-slot]` is the *layout box the 3D pouch is placed from*.
- **WHAT** Poster (LCP) → video after idle; masked headline reveal; parallax drift/scale on scroll; mouse parallax on dust layer; magnetic CTAs.
- **ASSETS** `hero-poster-*`, `hero-desktop.mp4`, `hero-mobile.mp4`, `powder-particles.webp`, GLB.
- **TEST** Network tab: only poster loads before `load`; mp4 after. Toggle Save-Data → no video. Resize → pouch re-fits the slot.

## 3D product stage (pinned)
- **FILES** `stage.{css,js}`, `gl/{experience,pouch,label,model,particles,three-lite}.js`
- **WHERE** `#stage` (520vh, sticky) + the single fixed `<canvas data-gl-canvas>`. **GLB goes in `public/assets/superwoman-product.glb`.**
- **WHAT** One revolution + tilt + FOV dolly while the sky washes white→pink→cream→lavender; 4 callouts (`[INGREDIENT CATEGORY]` placeholders, accumulate on desktop / one caption on mobile); pointer parallax (desktop) or scroll-velocity sway (touch); procedural pouch with soft contact shadow and 3-layer floating dust.
- **ASSETS** GLB (optional now). **TEST** scroll slowly through; scroll back up (must rewind). Drop a GLB in `public/assets/` → reload → `[data-gl]` gets `data-model="glb"`.

## One Scoop (pinned)
- **FILES** `scoop.{css,js}`, `scoop-scene.js`
- **WHERE** `#scoop` (400vh, sticky).
- **WHAT** Canvas-2D glass; powder grains fall from a tilting scoop (deterministic per-progress, so scrub-safe), water swirls, liquid turns pink, grains dissolve; closing line "Made for the woman doing everything."
- **ASSETS** `powder-particles.webp` (parallax dust). **TEST** scrub forward/back; mobile Safari; reduced-motion shows the finished state.

## Formula
- **FILES** `formula.{css,js}`, `core/tilt.js` · **WHERE** `#formula`
- **WHAT** 4 frosted-glass cards (01 Daily Foundation + 3 `[Formula benefit]`), staggered reveal, hover tilt + moving glint, parallax colour blooms.
- **ASSETS** none. **COPY NEEDED** all card descriptions. **TEST** hover cards (desktop); touch has no tilt by design.

## Built for her whole day
- **FILES** `day.{css,js}` · **WHERE** `#day` (sticky; height set from track width)
- **WHAT** Vertical scroll → horizontal strip of 8 moments (06:00 Pilates … 21:30 Relaxing), per-image counter-parallax, title drift, progress bar; lazy-plays `lifestyle-video.mp4`. Mobile/reduced: native swipe carousel with scroll-snap.
- **ASSETS** `lifestyle-01…03`, `lifestyle-video.mp4`. **TEST** desktop scroll; DevTools phone mode for swipe.

## Old way / Superwoman way
- **FILES** `compare.{css,js}` · **WHERE** `#compare`
- **WHAT** Drag (mouse/touch/pen) or use ← → on the hidden range input; clip-path wipe; left = cluttered bottles/capsules (inline SVG, unbranded), right = pouch + glass. Disclaimer: no replacement claims.
- **ASSETS** none (swap the SVG pouch for your render later). **TEST** drag; keyboard focus; vertical scroll still works on touch (`touch-action: pan-y`).

## How it works
- **FILES** `how.{css,js}` · **WHERE** `#how`
- **WHAT** Scoop · Mix · Own your day; each icon animates only while on screen. **COPY NEEDED** measure & mixing directions.

## Social proof
- **FILES** `proof.{css,js}`, `public/data/{reviews,ugc}.json` · **WHERE** `#proof`
- **WHAT** Renders real reviews/UGC from JSON via `textContent` (no HTML injection). Empty feeds ⇒ clearly labelled dev placeholders; rating & count are computed from data, never hard-coded. Hook for Judge.me/Okendo/Yotpo: change `cfg.data.reviews` or `renderReviews()`.
- **TEST** put `[{"name":"Test","rating":5,"text":"x","verified":true}]` in reviews.json → cards + average appear (then empty it again).

## Purchase
- **FILES** `shop.{css,js}`, `commerce.js` · **WHERE** `#shop`; product anchor `[data-gl-anchor]`; sticky bar `[data-atc-bar]`.
- **WHAT** Large 3D pouch (drag to spin) beside a glass buy box: One-time / Subscribe & Save, flavour chips (delete the block if N/A), quantity, magnetic Add to cart with live total; mobile sticky bar appears after the story and hides while the buy box/footer is visible. Prices come from `cfg.pricing` (null → `$[PRICE]`).
- **ASSETS** GLB. **COPY NEEDED** price, terms, trust line, disclaimer. **TEST** change qty/option → totals; Add to cart in demo mode; phone mode → sticky bar.

## FAQ
- **FILES** `faq.{css,js}` · **WHERE** `#faq`
- **WHAT** Accessible accordion (button + `aria-expanded` + region), animated via grid-rows. Medical/formula answers are marked "Needs approved copy". **TEST** keyboard Enter/Space.

## Footer & legal
- **WHERE** `<footer data-foot>` · Shop/Our Story/Ingredients/FAQ/Contact/Instagram/TikTok + disclaimer + Privacy/Terms/Refund placeholders (`links.*`).
