import './styles/index.css';
import { getConfig } from './config.js';
import { setAssetBase } from './js/core/assets.js';
import { prefersReduced, isDesktop, isConstrained, isLowPower, webglSupported } from './js/core/env.js';
import { gsap, ScrollTrigger, splitReveal, revealOnScroll, refreshSoon } from './js/core/motion.js';
import { initMagnetic } from './js/core/magnetic.js';
import { initNav } from './js/sections/nav.js';
import { initHero } from './js/sections/hero.js';
import { initStage } from './js/sections/stage.js';
import { initScoop } from './js/sections/scoop.js';
import { initFormula } from './js/sections/formula.js';
import { initDay } from './js/sections/day.js';
import { initCompare } from './js/sections/compare.js';
import { initHow } from './js/sections/how.js';
import { initProof } from './js/sections/proof.js';
import { initShop } from './js/sections/shop.js';
import { initFaq } from './js/sections/faq.js';

/**
 * boot(root) — wires every section. `root` is the .sws element (already in the DOM).
 * Sections only share one object: `state`, the scroll story the WebGL product listens to.
 */
export async function boot(root, overrides = {}) {
  const cfg = { ...getConfig(), ...overrides };
  setAssetBase(cfg.assetBase);

  const device = {
    reduced: prefersReduced(),
    mobile: !isDesktop(),
    constrained: isConstrained(),
    lowPower: isLowPower(),
  };
  root.dataset.dev = cfg.showPlaceholderTags ? 'on' : 'off';
  root.classList.toggle('sws-reduced', device.reduced);
  const state = { hero: 0, stage: 0, shop: 0 };

  root.querySelector('[data-year]').textContent = new Date().getFullYear();

  initNav(root, { cfg, device });
  initMagnetic(root);
  initHero(root, { state, device });
  initStage(root, { state, device });
  initScoop(root, { device });
  splitReveal('[data-split]', root);
  revealOnScroll(root);
  initFormula(root, { device });
  initDay(root, { device });
  initCompare(root, { device });
  initHow(root);
  initShop(root, { cfg, state, device });
  initFaq(root);
  initProof(root, { cfg });

  // Layout-affecting loads (fonts, lazy images) → recompute trigger positions once, debounced.
  document.fonts?.ready.then(() => refreshSoon(50));
  addEventListener('load', () => refreshSoon(100), { once: true });
  root.querySelectorAll('img[loading="lazy"]').forEach((i) => i.addEventListener('load', () => refreshSoon(300), { once: true }));
  let lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth !== lastW) { lastW = innerWidth; refreshSoon(200); } });   // ignore iOS URL-bar height changes

  // ---- 3D product (lazy; falls back to a static illustration) ------------------------------------
  const glOff = cfg.webgl === false || new URLSearchParams(location.search).get('webgl') === '0';
  const useGL = !glOff && !device.reduced && !device.constrained && webglSupported();
  if (useGL) {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
    idle(async () => {
      try {
        const { createExperience } = await import('./js/gl/experience.js');
        const container = root.querySelector('[data-gl]');
        await createExperience({
          container, canvas: container.querySelector('canvas'), state, cfg, device,
          anchorEl: root.querySelector('[data-gl-anchor]'), heroSlotEl: root.querySelector('[data-hero-slot]'),
        });
        container.classList.add('is-ready');
      } catch (err) {
        console.warn('[sws] WebGL unavailable, using static product:', err);
        staticProduct(root);
      }
    }, { timeout: 1500 });
  } else {
    staticProduct(root);
  }

  return { cfg, state, destroy: () => ScrollTrigger.getAll().forEach((t) => t.kill()) };
}

/** No-WebGL / reduced-motion / data-saver path: reuse the illustrated pouch so the layout never has a hole. */
function staticProduct(root) {
  const src = root.querySelector('.cmp__scene--new .pouch-svg');
  if (!src) return;
  const mk = (cls) => { const f = src.cloneNode(true); f.removeAttribute('class'); f.classList.add('static-product'); f.setAttribute('aria-hidden', 'true'); f.classList.add(cls); return f; };
  const slot = root.querySelector('[data-hero-slot]');
  slot?.classList.add('is-static'); slot?.prepend(mk('static-product--hero'));
  const anchor = root.querySelector('[data-gl-anchor]');
  anchor?.append(mk('static-product--shop'));
  root.querySelector('[data-gl]')?.remove();
}
