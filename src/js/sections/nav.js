import { ScrollTrigger } from '../core/motion.js';

export function initNav(root, { cfg, device }) {
  const nav = root.querySelector('[data-nav]');
  const toggle = root.querySelector('[data-menu-toggle]');
  const menu = root.querySelector('[data-menu]');

  // configurable link targets (data-link="story" → cfg.links.story)
  root.querySelectorAll('[data-link]').forEach((a) => {
    const target = cfg.links[a.dataset.link];
    if (target && target !== '#' ) a.setAttribute('href', target);
  });

  // menu
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // hide on scroll down, show on scroll up
  let lastY = scrollY;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const y = self.scroll(), dir = y - lastY;
      if (Math.abs(dir) > 6) { nav.classList.toggle('is-hidden', dir > 0 && y > 240 && menu.hidden); lastY = y; }
    },
  });

  // in-page anchors: smooth, honours reduced motion
  root.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const el = root.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: device.reduced ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', a.getAttribute('href'));
  });

  addEventListener('sws:cart', (e) => {
    const c = root.querySelector('[data-cart]'), n = e.detail.count;
    root.querySelector('[data-cart-count]').textContent = n;
    c.classList.toggle('has-items', n > 0);
    c.setAttribute('aria-label', `Cart, ${n} item${n === 1 ? '' : 's'}`);
  });
}
