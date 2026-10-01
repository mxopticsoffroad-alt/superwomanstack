import { onProgress } from '../core/motion.js';
import { smooth, clamp, isDesktop } from '../core/env.js';

/**
 * Pinned product exploration. The product itself lives in WebGL (gl/experience.js reads state.stage);
 * this module drives everything around it: sky colour, headline, callouts, progress dots.
 */
export function initStage(root, { state, device }) {
  const stage = root.querySelector('[data-stage]');
  if (!stage) return;
  if (device.reduced) { state.stage = 0; return; }

  const [, l1, l2, l3] = stage.querySelectorAll('.stage__bg i');
  const head = stage.querySelector('.stage__head');
  const callouts = [...stage.querySelectorAll('[data-callout]')];
  const dots = [...stage.querySelectorAll('[data-stage-dot]')];
  const AT = [0.14, 0.34, 0.54, 0.74];
  let last = -2;

  onProgress(stage, {}, (p) => {
    state.stage = p;
    stage.style.setProperty('--stage-p', p.toFixed(4));

    // soft white → baby pink → cream → lavender (stacked, so each reads as a clean wash)
    l1.style.opacity = smooth(0.06, 0.26, p);
    l2.style.opacity = smooth(0.42, 0.6, p);
    l3.style.opacity = smooth(0.74, 0.92, p);

    const hd = smooth(0.03, 0.13, p);
    head.style.opacity = 1 - hd;
    head.style.transform = `translate3d(0, ${-hd * 28}px, 0)`;

    // desktop: callouts accumulate around the product; mobile: one caption at a time
    const leaving = p > 0.92;
    let active = -1;
    AT.forEach((t, i) => { if (p >= t) active = i; });
    const key = (isDesktop() ? 'd' : 'm') + active + leaving;
    if (key === last) return;
    last = key;
    callouts.forEach((c, i) => c.classList.toggle('is-on', !leaving && (isDesktop() ? i <= active : i === active)));
    dots.forEach((d, i) => d.classList.toggle('is-on', i === active && !leaving));
  });
}
