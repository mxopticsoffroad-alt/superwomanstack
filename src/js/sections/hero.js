import { gsap } from '../core/motion.js';
import { hasHover } from '../core/env.js';
import { assetUrl } from '../core/assets.js';
import { whenVisible } from '../core/motion.js';

export function initHero(root, { state, device }) {
  const hero = root.querySelector('[data-hero]');
  if (!hero) return;
  const lines = hero.querySelectorAll('[data-hero-line]');
  const fades = hero.querySelectorAll('[data-hero-fade]');
  const poster = hero.querySelector('.hero__poster');
  const video = hero.querySelector('.hero__video');
  const dust = hero.querySelector('.hero__dust');

  // ---- intro choreography ------------------------------------------------------------------
  if (device.reduced) {
    gsap.set([...lines, ...fades], { clearProps: 'all', opacity: 1 });
  } else {
    lines.forEach((l) => { l.style.transform = 'none'; });   // inline beats the CSS pre-hide so GSAP starts from a clean 0
    gsap.fromTo(lines, { yPercent: 108 }, { yPercent: 0, duration: 1.5, ease: 'expo.out', stagger: 0.14, delay: 0.1 });
    gsap.to(fades, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, delay: 0.55 });
  }

  // ---- background video: deferred, device-appropriate, never blocks LCP -----------------------
  const skipVideo = device.reduced || device.constrained;
  if (video && !skipVideo) {
    const src = assetUrl(device.mobile ? video.dataset.srcMobile : video.dataset.srcDesktop);
    const start = () => {
      video.src = src; video.preload = 'auto';
      video.addEventListener('playing', () => video.classList.add('is-playing'), { once: true });
      video.addEventListener('error', () => video.removeAttribute('src'), { once: true });   // keep poster
      video.play().catch(() => { /* autoplay blocked: poster stays */ });
      whenVisible(hero, (v) => (v ? video.play().catch(() => {}) : video.pause()));
    };
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 400));
    const go = () => idle(start, { timeout: 2500 });
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
  }

  if (device.reduced) return;

  // ---- scroll: media drifts + scales, copy lifts away, product state for WebGL ----------------
  const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6, onUpdate: (s) => { state.hero = s.progress; }, onRefresh: (s) => { state.hero = s.progress; } } });
  tl.to([poster, video].filter(Boolean), { scale: 1.2, yPercent: 8, ease: 'none' }, 0)
    .to(dust, { yPercent: -16, ease: 'none' }, 0)
    .to('.hero__title', { yPercent: -14, ease: 'none' }, 0)
    .to('.hero__foot', { y: -50, opacity: 0, ease: 'none' }, 0);

  // ---- desktop: subtle mouse parallax on the photographic layers --------------------------------
  if (hasHover()) {
    const qx = gsap.quickTo(dust, 'x', { duration: 1.2, ease: 'power3.out' });
    const qy = gsap.quickTo(dust, 'y', { duration: 1.2, ease: 'power3.out' });
    hero.addEventListener('pointermove', (e) => {
      const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
      qx(nx * -40); qy(ny * -30);
    });
  }
}
