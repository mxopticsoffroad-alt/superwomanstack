# Superwoman Stack — scroll-driven DTC experience

A premium, scroll-choreographed site for **superwomanstack.com**: GSAP + ScrollTrigger, one Three.js product canvas, a Canvas-2D powder/glass scene, vanilla CSS design tokens. Built to run on a **Squarespace** site via Code Injection (hosted externally), or standalone.

> All formula, ingredient, price, review and legal content is a clearly marked placeholder. Nothing is invented.

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # dist/        standalone site
npm run build:embed    # dist-embed/  Squarespace bundle (host this, see docs/SQUARESPACE.md)
npm run check          # first-load budgets (JS/CSS/HTML/poster)
npm run assets         # regenerate placeholder media
npm run assets:optimize  # originals in assets-src/ → AVIF/WebP sets
```

| Read | |
|---|---|
| `docs/ARCHITECTURE.md` | concept, page architecture, animation timeline, hosting, performance |
| `docs/SECTIONS.md` | per-section files / what it does / assets / how to test |
| `docs/ASSETS.md` | every asset to provide + specs |
| `docs/SQUARESPACE.md` | deployment, code injection, add-to-cart, launch checklist |

```
index.html              standalone shell          src/body.html     ALL page markup (shared by both builds)
src/config.js           runtime config            src/app.js        boot + wiring
src/styles/             tokens → base → ui → sections/*
src/js/core/            env, assets, motion (GSAP), magnetic, tilt
src/js/gl/              Three.js: experience, pouch (placeholder), model (GLB), particles
src/js/sections/        one module per section
embed/                  Squarespace snippets      public/           assets, data, _headers
```

Flags: `?webgl=0` static-product fallback · `?sws=off` (Squarespace) plain page.
