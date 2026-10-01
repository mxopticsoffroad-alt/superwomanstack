import { gsap, ScrollTrigger, whenVisible } from '../core/motion.js';
import { assetUrl } from '../core/assets.js';

/**
 * "Built for her whole day" — vertical scroll drives a horizontal track with per-image parallax.
 * Mobile and reduced-motion get a native swipe carousel instead (no scroll hijacking, no jank).
 */
export function initDay(root, { device }) {
  const sec = root.querySelector('[data-day]');
  if (!sec) return;
  const row = sec.querySelector('[data-day-track]');
  const moments = [...sec.querySelectorAll('.moment')];
  const imgs = moments.map((m) => m.querySelector('.moment__media img, .moment__media video'));
  const videos = sec.querySelectorAll('[data-lazy-video]');

  // Lazy video: only fetch/play when near the viewport; honour data-saver and reduced motion.
  videos.forEach((v) => {
    if (device.reduced || device.constrained) return;
    whenVisible(v, (on) => {
      if (on) { if (!v.src) { v.src = assetUrl(v.dataset.src); } v.play().catch(() => {}); } else v.pause();
    }, '200px');
  });

  const mm = gsap.matchMedia();
  mm.add('(min-width: 760px) and (prefers-reduced-motion: no-preference)', () => {
    let dist = 0, lefts = [], widths = [];
    const measure = () => {
      dist = Math.max(0, row.scrollWidth - window.innerWidth);
      sec.style.setProperty('--day-extra', `${dist}px`);
      lefts = moments.map((m) => m.offsetLeft + row.offsetLeft); widths = moments.map((m) => m.offsetWidth);
    };
    measure();
    const title = row.querySelector('.day__title');
    const setX = gsap.quickSetter(row, 'x', 'px');
    const setTitle = gsap.quickSetter(title, 'x', 'px');
    const setImg = imgs.map((i) => gsap.quickSetter(i, 'x', 'px'));

    const st = ScrollTrigger.create({
      trigger: sec, start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true,
      onRefresh: measure,
      onUpdate: (self) => {
        const p = self.progress, x = -p * dist, vw = window.innerWidth;
        setX(x); setTitle(-p * dist * 0.1);
        sec.style.setProperty('--day-p', p.toFixed(4));
        for (let i = 0; i < moments.length; i++) {          // images drift slower than frames → depth
          const centre = lefts[i] + x + widths[i] / 2 - vw / 2;
          setImg[i](clamp(centre / vw, -1, 1) * -widths[i] * 0.07);
        }
      },
    });
    return () => { st.kill(); gsap.set([row, title, ...imgs], { clearProps: 'transform' }); sec.style.removeProperty('--day-extra'); };
  });

}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
