import { ScrollTrigger, onProgress } from '../core/motion.js';
import { clamp } from '../core/env.js';
import { addToCart, initCartBadge } from '../commerce.js';

export function initShop(root, { cfg, state, device }) {
  const sec = root.querySelector('[data-shop]');
  const form = root.querySelector('[data-buy]');
  if (!sec || !form) return;

  const fmt = (v) => (v == null ? `${cfg.pricing.currency}[PRICE]` : `${cfg.pricing.currency}${(+v).toFixed(v % 1 ? 2 : 0)}`);
  const el = (s) => form.querySelector(s);
  const qtyOut = el('[data-qty-out]'), total = el('[data-total]'), status = el('[data-status]');
  const atc = el('[data-atc]'), atcLabel = el('[data-atc-label]');
  const bar = root.querySelector('[data-atc-bar]'), barBtn = root.querySelector('[data-bar-cta]'), barPrice = root.querySelector('[data-bar-price]');
  let qty = 1;

  const sel = () => ({
    qty, purchase: form.querySelector('[name=purchase]:checked').value,
    flavor: form.querySelector('[name=flavor]:checked')?.value,
  });
  const unit = () => (sel().purchase === 'subscribe' ? cfg.pricing.subscribe : cfg.pricing.once);
  const render = () => {
    qtyOut.textContent = qty;
    el('[data-price="once"]').textContent = fmt(cfg.pricing.once);
    el('[data-price="subscribe"]').textContent = fmt(cfg.pricing.subscribe);
    const u = unit();
    total.textContent = `· ${u == null ? fmt(null) : fmt(u * qty)}`;
    barPrice.textContent = fmt(u);
  };
  form.addEventListener('change', render);
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-qty]'); if (!b) return;
    qty = clamp(qty + +b.dataset.qty, 1, 12, ); render();
  });

  let busy = false, resetT;
  const submit = async () => {
    if (busy) return; busy = true; atc.disabled = true; atcLabel.textContent = 'Adding…'; status.textContent = '';
    try {
      await addToCart(cfg, sel());
      atc.classList.add('is-added'); atcLabel.textContent = 'Added ✓';
      status.textContent = cfg.commerce.provider === 'demo' ? 'Demo mode: no real cart yet (see docs/SQUARESPACE.md).' : 'Added to your cart.';
    } catch (err) {
      atcLabel.textContent = 'Add to cart'; status.textContent = err.message || 'Something went wrong. Please try again.';
    } finally {
      busy = false; atc.disabled = false;
      clearTimeout(resetT); resetT = setTimeout(() => { atc.classList.remove('is-added'); atcLabel.textContent = 'Add to cart'; }, 2600);
    }
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
  barBtn.addEventListener('click', submit);
  render(); initCartBadge();

  // product (WebGL) enters with the section
  if (!device.reduced) {
    onProgress(sec, { start: 'top bottom', end: 'top 25%' }, (p) => { state.shop = p; });
  }

  // sticky mobile bar: visible once the immersive story (hero → scoop) is over, hidden while the buy box / footer is on screen
  let past = false, inShop = false, inFoot = false;
  const upd = () => { const on = past && !inShop && !inFoot; bar.classList.toggle('is-visible', on); bar.setAttribute('aria-hidden', String(!on)); barBtn.tabIndex = on ? 0 : -1; };
  ScrollTrigger.create({ trigger: root.querySelector('#formula'), start: 'top 75%', onEnter: () => { past = true; upd(); }, onLeaveBack: () => { past = false; upd(); } });
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.target === sec) inShop = e.isIntersecting; else inFoot = e.isIntersecting; upd(); }), { threshold: 0.12 });
  io.observe(sec); io.observe(root.querySelector('[data-foot]'));
}
