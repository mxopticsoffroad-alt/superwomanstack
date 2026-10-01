# Superwoman Stack — creative direction & architecture

## 1. Visual concept — "Morning Light"

The site is a 30-second commercial you scroll through. One idea carries it: **the light changes as the day goes on.**

| Beat | What the viewer sees | Light |
|---|---|---|
| Hero | Soft-focus wellness video, huge editorial headline, the pouch floating below it | warm white + blush |
| The Stack | Pouch pinned centre, one slow revolution, glass callouts appear | white → baby pink → cream → lavender |
| One scoop | Powder falls into a glass, water swirls, the drink turns pink, grains dissolve | lavender → blush |
| Formula | Four frosted glass cards drift in over soft colour blooms | blush → cream |
| Her whole day | Vertical scroll drives a horizontal film-strip, 06:00 → 21:30 | cream |
| Old way / Superwoman way | Drag to wipe a cluttered pile of bottles into one pouch + one glass | cream → warm white |
| How it works | Scoop · Mix · Own your day, each with a tiny looping animation | warm white |
| Proof | Review + UGC infrastructure (placeholders only) | warm white → blush |
| Buy | The same pouch returns, glued to the buy box; drag it to spin | blush → baby pink |
| Footer | Deep charcoal with a giant baby-pink wordmark | ink |

**Type:** Instrument Serif (display; roman for statements, *italic* for the emotional word) at dramatic scale (headlines are 30–60% of the viewport) + Hanken Grotesk (UI/body) tracked wide in small caps. **Palette:** `#F7DDE5 #FCEEF2 #FFF9F7 #F4E8DF #E9DFEE` + peach `#F9E1D3`, ink `#171417`; one deeper rose (`#C26A87` / AA-text `#9B4863`) used only for small accents. All of it lives in `src/styles/tokens.css`.

**Motion rules:** every animation either advances the story (scroll-scrubbed), gives feedback (magnetic buttons, tilt, accordion), or reveals content (masked text). Nothing loops decoratively except the three tiny "How it works" icons and the shop's orbit ring.

## 2. Page architecture

```
<nav>                      fixed glass pill; hides on scroll-down
<canvas.gl>                ONE persistent WebGL canvas (fixed, z=1) — the product
<main>
  #top      hero           video + poster, headline, product slot, CTAs
  #stage    pinned 520vh   3D rotation + callouts + colour washes     (CSS sticky)
  #scoop    pinned 400vh   Canvas-2D powder → glass                   (CSS sticky)
  #formula                 4 glass cards
  #day      pinned         horizontal parallax film-strip             (CSS sticky; native carousel on mobile)
  #compare                 drag-to-compare old vs. new
  #how                     3 steps
  #proof                   reviews + UGC (data-driven, placeholders)
  #shop                    buy box + product anchor
  #faq                     accordion
<footer>
sticky mobile add-to-cart bar
```

Stacking contract (single stacking context): `0` section backgrounds/video → `1` WebGL canvas → `2` section content → `50` nav & bars. That is how the 3D pouch can sit *behind* the headline yet *in front of* the video.

## 3. Animation timeline

`state.hero`, `state.stage`, `state.shop` (0→1) are written by ScrollTriggers; the WebGL pose is a **pure function** of them, so scrolling up rewinds perfectly.

| Scroll | Driver | Effect |
|---|---|---|
| Hero 0→100% | hero.js | video scales 1.04→1.2 & drifts, headline lifts, CTAs fade; pouch rises from its layout slot to screen-centre |
| Stage 0→100% | stage.js + experience.js | pouch: 1 full rotation (`rotY 0.35 → 0.35+2π`), tilt sine ±0.13, camera FOV 28→21→28 (dolly feel). Colour wash: pink @6–26%, cream @42–60%, lavender @74–92%. Callouts at 14/34/54/74% (desktop accumulates, mobile swaps one caption). Pouch fades/lifts out 93–100%. |
| Scoop 0→100% | scoop.js + scoop-scene.js | 0–10% scoop enters · 10–22% tilts · 12–55% **150 grains** fall (each a closed-form function of progress) · 26–82% water → pink · 22–50% swirl bands · 84–97% twinkles + closing line |
| Formula | revealOnScroll | cards stagger in; blobs parallax ±30% |
| Day | day.js | `x = −progress × (trackWidth − viewport)`; each image counter-drifts ±7% of its width (depth); title moves at 10% extra |
| Compare | compare.js | pointer/touch drag + range input; one-time idle "wiggle" hint |
| Shop entry | shop.js | `state.shop` 0→1 as the section enters; pouch snaps to `[data-gl-anchor]`, then spins; drag adds inertia |

## 4. What runs directly inside Squarespace?

Squarespace has **no place to upload a JS bundle or WebGL assets**, and its Code Blocks are size/format limited and live inside Squarespace's own layout CSS. So:

| Piece | Where it runs |
|---|---|
| The page shell, SEO title/description, checkout, cart, policies, domain | **Squarespace** (unchanged) |
| Two small snippets (header + footer) | **Squarespace → Code Injection** (Business plan or higher) |
| JS/CSS bundle, fonts, images, video, GLB, JSON feeds | **External static host** (Cloudflare Pages recommended) |

The embed *takes over* the pages you list (`/` by default): Squarespace chrome is hidden, our markup is mounted, Squarespace Commerce still owns the cart. Alternatively mount it inline in a Code Block (`embed/squarespace-inline-block.html`).

## 5. What must be hosted externally?

Everything heavy. `npm run build:embed` → `dist-embed/` → deploy to Cloudflare Pages / Netlify / Vercel / S3+CloudFront on a subdomain (e.g. `experience.superwomanstack.com`). `public/_headers` already contains the required **CORS** rule (ES modules loaded cross-origin need it), cache rules and `nosniff`. Large videos (>10 MB total) are better on a video CDN (Cloudflare Stream, Mux, Bunny) — just point `data-src-*` at their MP4 URLs.

A fully standalone build (`npm run build` → `dist/`) also works if you ever move the whole domain off Squarespace.

## 6. Assets you need to provide → `docs/ASSETS.md`

## 7. Where the 3D product model goes

`public/assets/superwoman-product.glb`. On load `gl/model.js` does a `HEAD` request; if the file is real it's loaded (Meshopt-compressed GLBs supported), auto-centred and scaled to the pouch's height; otherwise the procedural, clearly-labelled placeholder pouch (`gl/pouch.js` + `gl/label.js`) renders. **No code change is needed to swap it in.** Same pose system drives either model.

## 8. Where the lifestyle videos go

- Hero: `public/assets/hero-desktop.mp4` (1280×720–1920×1080, 6–10 s loop) and `hero-mobile.mp4` (540×960–720×1280). Chosen at runtime by viewport; poster frames are `hero-poster-*.avif/webp`.
- Lifestyle strip: `public/assets/lifestyle-video.mp4` (the "Working" panel; lazy-loaded when within 200 px of the viewport) and `lifestyle-01…03.webp` stills (reused across the 8 moments until you add more — see `src/body.html`, `#day`).
- UGC: `public/data/ugc.json`.

## Performance model

| Technique | Where |
|---|---|
| Initial JS **52 kB gz**, CSS **12 kB gz**, HTML **8 kB gz** (`npm run check` enforces budgets) | build |
| three.js (~160 kB gz) only after `requestIdleCallback`, tree-shaken via `gl/three-lite.js` | app.js |
| Hero LCP = preloaded AVIF poster; video starts only after `load` + idle; skipped on Save-Data / 2G / reduced motion | hero.js |
| Mobile gets its own video file, fewer particles (70 vs 190), DPR ≤ 1.5, fewer mesh segments | env/experience |
| Only `transform`/`opacity`/`clip-path` animate; `gsap.quickSetter` for per-frame writes; no layout reads in scroll handlers | everywhere |
| WebGL stops rendering entirely when the product is invisible; pauses on hidden tab; recovers from context loss | experience.js |
| Pinned sections use CSS `sticky` (no pin-spacers, no iOS jank); `ignoreMobileResize` for the URL bar; `svh` units | stage/scoop/day css |
| Fonts self-hosted woff2 (latin), `font-display: swap`; AVIF + WebP `srcset`; `loading=lazy`, explicit `width/height` (CLS) | markup |
| `prefers-reduced-motion`: no scrubbing, no WebGL, static pouch, native carousels, accordions still work | env/css |
| No WebGL / error: illustrated static pouch fallback keeps the layout whole | app.js |
