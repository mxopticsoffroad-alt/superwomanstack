import { gsap } from '../core/motion.js';
import { initTilt } from '../core/tilt.js';

export function initFormula(root, { device }) {
  const sec = root.querySelector('#formula');
  if (!sec) return;
  initTilt(sec.querySelectorAll('[data-card]'));
  if (device.reduced) return;
  gsap.to('.formula__blob--a', { yPercent: 30, xPercent: 8, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 1 } });
  gsap.to('.formula__blob--b', { yPercent: -35, xPercent: -10, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: 1 } });
}
