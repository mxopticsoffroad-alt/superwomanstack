import { gsap } from './motion.js';
import { hasHover } from './env.js';

/** Soft 3D tilt + moving glint on cards. Pointer-fine devices only. */
export function initTilt(cards, max = 7) {
  if (!hasHover()) return;
  cards.forEach((card) => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * max * 2); rx(-(py - 0.5) * max * 2);
      card.style.setProperty('--mx', `${px * 100}%`); card.style.setProperty('--my', `${py * 100}%`);
    });
    card.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}
