import { gsap, ScrollTrigger } from '../core/motion.js';

/** Old way ⇄ Superwoman way. Pointer-drag (mouse/touch/pen) + a real <input type=range> for keyboard & AT. */
export function initCompare(root, { device }) {
  const sec = root.querySelector('[data-compare]');
  if (!sec) return;
  const box = sec.querySelector('[data-cmp]');
  const range = sec.querySelector('[data-cmp-range]');
  const set = (v) => {
    const p = Math.min(96, Math.max(4, v));
    box.style.setProperty('--p', p.toFixed(2));
    range.value = String(Math.round(p));
  };

  const fromEvent = (e) => { const r = box.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); };
  let dragging = false;
  box.addEventListener('pointerdown', (e) => {
    dragging = true; box.classList.add('is-drag'); box.setPointerCapture(e.pointerId); fromEvent(e); box._hinted = true;
  });
  box.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
  const end = () => { dragging = false; box.classList.remove('is-drag'); };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);

  // keyboard / assistive tech
  range.addEventListener('input', () => set(+range.value));

  // one-time "you can drag this" hint when it scrolls into view
  if (!device.reduced) {
    ScrollTrigger.create({
      trigger: box, start: 'top 70%', once: true,
      onEnter: () => {
        if (box._hinted) return;
        const o = { v: 50 };
        gsap.timeline()
          .to(o, { v: 66, duration: 0.9, ease: 'power2.inOut', onUpdate: () => !box._hinted && set(o.v) })
          .to(o, { v: 36, duration: 1.2, ease: 'power2.inOut', onUpdate: () => !box._hinted && set(o.v) })
          .to(o, { v: 50, duration: 0.9, ease: 'power2.inOut', onUpdate: () => !box._hinted && set(o.v) });
      },
    });
  }
}
