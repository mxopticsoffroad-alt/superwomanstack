# Assets you need to provide

Everything below ships as a **generated placeholder** (run `npm run assets` to regenerate them). Replace a file by dropping your real one at the **same path**. Dashed "placeholder" pills in the UI disappear when you set `showPlaceholderTags: false`.

| Path | Status | Spec |
|---|---|---|
| `public/assets/superwoman-product.glb` | **Not generated** (procedural pouch renders until it exists) | GLB, **< 2 MB**, PBR materials, +Y up, front faces +Z, origin anywhere (auto-centred). Compress with `npx gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp`. Textures ≤ 2048². |
| `public/assets/hero-desktop.mp4` | placeholder gradient | H.264, 1280×720 (or 1920×1080), 6–10 s seamless loop, no audio, **< 3 MB**, `-movflags +faststart`. Cool-to-warm pink/cream grade. |
| `public/assets/hero-mobile.mp4` | placeholder gradient | H.264, 540×960 or 720×1280 portrait, **< 1.5 MB**, same rules. |
| `public/assets/hero-poster-desktop-{960,1920}.{avif,webp}` + `hero-poster-mobile-{450,900}.{avif,webp}` | placeholder | First frame of each hero video. This is the **LCP image** — keep AVIF ≤ 150 kB. Generate with `npm run assets:optimize`. |
| `public/assets/powder-particles.webp` | placeholder | Transparent PNG/WebP of soft dust/bokeh, ~1600², used as a `soft-light` parallax layer. |
| `public/assets/lifestyle-01.webp`, `-02`, `-03` (+ `-640/-1280/-1600` avif & webp) | placeholder | 4:5 portrait editorial stills, ≥ 1600 px wide. Used for Pilates / Breakfast / Walking and reused for Travel / Training / Yoga / Relaxing until you add more panels (see `#day` in `src/body.html`). |
| `public/assets/lifestyle-video.mp4` | placeholder | H.264 4:5 (720×900), 6–10 s loop, no audio, < 2 MB. |
| `public/data/reviews.json`, `public/data/ugc.json` | empty `[]` | Real data only — schema in `src/js/sections/proof.js`. |
| Fonts | bundled | Instrument Serif + Hanken Grotesk via `@fontsource` (SIL OFL). Swap in `src/styles/tokens.css` if you license a different pair. |

**Creative direction for footage/photography**: natural window light; pink/cream grade; hands, glass, powder, water, skin; Pilates/yoga/kitchen/walking; real women, unposed, no gym-bro lighting. Keep faces optional — product, glass and movement carry the story.

## Optimising your own photos
```bash
cp ~/Downloads/lifestyle-01.jpg assets-src/
npm run assets:optimize     # → public/assets/lifestyle-01-{480…2560}.{avif,webp} + lifestyle-01.webp
```

## Still missing before launch (not invented anywhere)
Ingredients, doses, Supplement Facts, flavours, price(s), subscription terms & discount, shipping/returns/guarantee copy, FDA/legal disclaimer, reviews, UGC, social handles, contact email, policy URLs. Every one is a bracketed placeholder in `src/body.html` or a field in `src/config.js`.
