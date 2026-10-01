/**
 * Runtime configuration. Override anything by defining window.SWS_CONFIG BEFORE the script loads
 * (that's how Squarespace Code Injection passes settings — see embed/squarespace-footer.html).
 */
export const DEFAULTS = {
  /** Where /assets and /data live. null → auto (same origin as the script). Must end with "/". */
  assetBase: null,
  /** Product 3D model. Missing file → procedural placeholder pouch is rendered instead. */
  modelUrl: 'assets/superwoman-product.glb',
  /** Show the dashed "placeholder" pills. Set false at launch. */
  showPlaceholderTags: true,
  /** 'auto' | false. Also: add ?webgl=0 to the URL to test the no-WebGL fallback. */
  webgl: 'auto',
  /** Squarespace takeover: URL paths where the embed replaces the whole page. */
  takeoverPaths: ['/'],

  pricing: {
    currency: '$',
    once: null,         // e.g. 59 — null renders "$[PRICE]"
    subscribe: null,    // e.g. 49
  },

  commerce: {
    /** 'demo' (no network; updates the cart badge) | 'squarespace' | 'link' */
    provider: 'demo',
    /** 'link': page the Add to Cart button sends the shopper to (e.g. your Squarespace product URL). */
    productUrl: '',
    /** 'squarespace': values from your product (see docs/SQUARESPACE.md → "Add to cart"). */
    itemId: '',
    sku: '',
    subscribeSku: '',
    flavorSkus: {},     // { 'flavor-1': 'SQ123', 'flavor-2': 'SQ456' }
    cartUrl: '/cart',
    /** After a successful add: 'toast' | 'redirect' */
    onAdded: 'toast',
  },

  links: {
    story: '#day', ingredients: '#stage', faq: '#faq', shop: '#shop',
    contact: '#', instagram: '#', tiktok: '#', privacy: '#', terms: '#', refunds: '#',
  },

  /** Optional JSON feeds for social proof. Real data only. */
  data: { reviews: 'data/reviews.json', ugc: 'data/ugc.json' },
};

export function getConfig() {
  const user = (typeof window !== 'undefined' && window.SWS_CONFIG) || {};
  const merge = (a, b) => {
    const out = { ...a };
    for (const k in b) out[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) ? merge(a[k] || {}, b[k]) : b[k];
    return out;
  };
  return merge(DEFAULTS, user);
}
