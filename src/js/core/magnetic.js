import { hasHover } from './env.js';

/** Buttons drift toward the cursor. Pointer-fine devices only (no touch equivalent by design). */
export function initMagnetic(root, strength = 0.28) {
  if (!hasHover()) return;
  root.querySelectorAll('[data-magnetic]').forEach((el) => {
    const label = el.firstElementChild;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.setProperty('--bx', `${x * strength}px`);
      el.style.setProperty('--by', `${y * strength}px`);
      if (label) label.style.transform = `translate3d(${x * 0.08}px, ${y * 0.12}px, 0)`;
    });
    const reset = () => { el.style.setProperty('--bx', '0px'); el.style.setProperty('--by', '0px'); if (label) label.style.transform = ''; };
    el.addEventListener('pointerleave', reset);
    el.addEventListener('blur', reset);
  });
}
