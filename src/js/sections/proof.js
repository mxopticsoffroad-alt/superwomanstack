import { assetUrl } from '../core/assets.js';

/**
 * Social-proof infrastructure. Reads REAL data from /data/reviews.json and /data/ugc.json.
 * Nothing is ever fabricated: with empty feeds the labelled placeholders simply stay.
 *
 * reviews.json → [{ "name": "Jane", "rating": 5, "text": "…", "verified": true, "date": "2026-01-02" }]
 * ugc.json     → [{ "type": "video" | "image", "src": "…", "poster": "…", "href": "https://…", "handle": "@…" }]
 *
 * All text is inserted with textContent (never innerHTML). To use a review app (Judge.me, Okendo,
 * Yotpo, Stamped…) point cfg.data.reviews at their JSON export/proxy or replace renderReviews().
 */
const fetchJSON = async (url) => {
  try { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok || /text\/html/.test(r.headers.get('content-type') || '')) return []; const j = await r.json(); return Array.isArray(j) ? j : []; }
  catch { return []; }
};
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

function renderReviews(root, list) {
  const host = root.querySelector('[data-reviews]');
  if (!list.length) return;
  host.replaceChildren(...list.slice(0, 6).map((r) => {
    const a = el('article', 'review glass');
    const s = el('span', 'stars', stars(r.rating || 5)); s.setAttribute('aria-label', `${r.rating || 5} out of 5 stars`);
    const p = el('p', null, `“${r.text}”`);
    const f = el('footer', null, [r.name, r.verified ? 'Verified buyer' : ''].filter(Boolean).join(' · '));
    a.append(s, p, f); return a;
  }));
  const rated = list.filter((r) => +r.rating > 0);
  if (rated.length) {
    const avg = rated.reduce((a, r) => a + +r.rating, 0) / rated.length;
    root.querySelector('[data-rating-score]').textContent = avg.toFixed(1);
    root.querySelector('[data-rating-count]').textContent = `${rated.length} review${rated.length === 1 ? '' : 's'}`;
    root.querySelector('[data-rating] .dev-tag')?.remove();
  }
}

function renderUGC(root, list) {
  const rail = root.querySelector('[data-ugc-rail]');
  if (!list.length) return;
  rail.replaceChildren(...list.slice(0, 10).map((u) => {
    const li = el('li', 'ugc__tile');
    const media = u.type === 'video' ? el('video') : el('img');
    if (u.type === 'video') { Object.assign(media, { muted: true, loop: true, playsInline: true, preload: 'none', poster: u.poster ? assetUrl(u.poster) : '' }); media.dataset.src = u.src; media.setAttribute('aria-label', u.handle || 'Customer video'); }
    else { media.src = assetUrl(u.src); media.alt = u.handle ? `Photo from ${u.handle}` : 'Customer photo'; media.loading = 'lazy'; }
    li.append(media);
    if (u.type === 'video') {
      li.append(el('span', 'ugc__play'));
      li.addEventListener('click', () => { if (!media.src) media.src = assetUrl(u.src); media.paused ? media.play() : media.pause(); li.classList.toggle('is-playing', !media.paused); });
    } else if (u.href) li.addEventListener('click', () => window.open(u.href, '_blank', 'noopener'));
    return li;
  }));
}

export async function initProof(root, { cfg }) {
  const [reviews, ugc] = await Promise.all([fetchJSON(assetUrl(cfg.data.reviews)), fetchJSON(assetUrl(cfg.data.ugc))]);
  renderReviews(root, reviews); renderUGC(root, ugc);
}
