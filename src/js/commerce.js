/**
 * Add-to-cart adapter. The UI never talks to a cart directly — it calls addToCart() and this file
 * decides how, based on cfg.commerce.provider:
 *
 *   'demo'         no network. Increments the cart badge. Use while designing.
 *   'link'         sends the shopper to your real product page (always works, zero risk).
 *   'squarespace'  posts to Squarespace Commerce's cart endpoint from the same origin.
 *                  ⚠ This endpoint is undocumented: confirm the exact payload by watching the
 *                  Network tab while pressing your product's native "Add to Cart" button, then
 *                  mirror it in `squarespaceAdd`. See docs/SQUARESPACE.md → "Add to cart".
 */
let count = 0;
try { count = +sessionStorage.getItem('sws:cart') || 0; } catch { /* storage blocked */ }

const announce = () => {
  try { sessionStorage.setItem('sws:cart', String(count)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('sws:cart', { detail: { count } }));
};
export const initCartBadge = announce;

function crumb() {
  const m = document.cookie.match(/(?:^|;\s*)crumb=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

async function squarespaceAdd(c, { qty, purchase, flavor }) {
  const sku = (purchase === 'subscribe' && c.subscribeSku) || c.flavorSkus?.[flavor] || c.sku;
  if (!c.itemId || !sku) throw new Error('Squarespace itemId / sku not configured (cfg.commerce).');
  const res = await fetch(`/api/commerce/shopping-cart/entries?crumb=${encodeURIComponent(crumb())}`, {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId: c.itemId, sku, quantity: qty, additionalFields: '[]' }),
  });
  if (!res.ok) throw new Error(`Cart request failed (${res.status}).`);
}

export async function addToCart(cfg, selection) {
  const c = cfg.commerce;
  if (c.provider === 'link') {
    if (!c.productUrl) throw new Error('cfg.commerce.productUrl is not set.');
    window.location.href = c.productUrl; return;
  }
  if (c.provider === 'squarespace') await squarespaceAdd(c, selection);
  else await new Promise((r) => setTimeout(r, 450));   // demo latency
  count += selection.qty; announce();
  if (c.onAdded === 'redirect' && c.provider === 'squarespace') window.location.href = c.cartUrl;
}
