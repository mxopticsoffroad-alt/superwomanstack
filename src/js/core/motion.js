import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReduced } from './env.js';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });   // iOS Safari: URL-bar show/hide must not refresh triggers
gsap.defaults({ ease: 'power3.out' });

export { gsap, ScrollTrigger };

/** Splits an element's text into masked words (keeps <em> etc.). Returns the inner word nodes. */
export function splitWords(el) {
  const words = [];
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const wrap = document.createElement('span'); wrap.className = 'sw';
          const inner = document.createElement('i'); inner.textContent = part;
          wrap.append(inner); frag.append(wrap); words.push(inner);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
  return words;
}

/** Headline word-by-word reveal when scrolled into view. */
export function splitReveal(selector, root = document) {
  root.querySelectorAll(selector).forEach((el) => {
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    const words = splitWords(el);
    el.setAttribute('aria-label', label);
    words.forEach((w) => w.setAttribute('aria-hidden', 'true'));
    if (prefersReduced()) return;
    gsap.set(words, { yPercent: 112 });
    ScrollTrigger.create({
      trigger: el, start: 'top 86%', once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: 0.045 }),
    });
  });
}

/** Fade/lift [data-reveal] items in batches (staggered siblings). */
export function revealOnScroll(root = document) {
  const items = root.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  ScrollTrigger.batch(items, {
    start: 'top 90%', once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, overwrite: true, clearProps: 'willChange' }),
  });
}

/**
 * Scroll-linked progress (0→1). Callback receives (progress, self). Uses `scrub` only as a hint for
 * smoothing in the consumer; values here are the raw, deterministic scroll position.
 */
export function onProgress(trigger, { start = 'top top', end = 'bottom bottom', ...rest } = {}, cb) {
  return ScrollTrigger.create({
    trigger, start, end,
    onUpdate: (self) => cb(self.progress, self),
    onRefresh: (self) => cb(self.progress, self),
    ...rest,
  });
}

/** Run `fn` when `el` is within `margin` of the viewport (and again with false when it leaves). */
export function whenVisible(el, fn, margin = '0px') {
  const io = new IntersectionObserver(([e]) => fn(e.isIntersecting), { rootMargin: margin });
  io.observe(el);
  return () => io.disconnect();
}

/** rAF-throttled refresh after layout-affecting loads. */
let t;
export function refreshSoon(ms = 150) {
  clearTimeout(t);
  t = setTimeout(() => ScrollTrigger.refresh(), ms);
}
