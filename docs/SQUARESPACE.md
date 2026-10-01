# Putting this on superwomanstack.com (Squarespace)

## Requirements
Squarespace **Business plan or higher** (Code Injection). Squarespace Commerce stays your store.

## 1 · Build & host the bundle
```bash
npm ci
npm run build:embed        # → dist-embed/  (sws-embed.js, sws-embed.css, sws/, assets/, data/, _headers)
```
Deploy `dist-embed/` to a static host on a **subdomain you control**, e.g. Cloudflare Pages:
1. Pages → *Create project* → *Direct upload* → drag `dist-embed/` (or `npx wrangler pages deploy dist-embed`).
2. Custom domain `experience.superwomanstack.com` (Squarespace → Settings → Domains → DNS → add the CNAME Cloudflare shows).
3. Check `https://experience.superwomanstack.com/sws-embed.js` loads and the response has `access-control-allow-origin: *` (from `_headers`).

## 2 · Code Injection
Squarespace → **Settings → Developer Tools → Code Injection**
- **Header** ← paste `embed/squarespace-header.html` (hides the stock page on takeover URLs; self-heals after 6 s).
- **Footer** ← paste `embed/squarespace-footer.html`, replace the origin and fill the config.

Make sure a page exists at the takeover path (`/` = your homepage). Its title/description in Squarespace's SEO panel are what Google shows; the experience replaces only the visible body.

### Escape hatches (so you can never lock yourself out)
- The experience **never takes over inside the Squarespace editor** (framed pages).
- Append `?sws=off` to any URL to see the plain Squarespace page.
- Remove the footer script to disable everything instantly.

### Inline instead of takeover (optional)
Add a **Code Block** with `embed/squarespace-inline-block.html`, set `takeoverPaths: []`, and paste `embed/squarespace-custom.css` (edit the page ID) so the block is full-bleed and Squarespace chrome is hidden on that page.

## 3 · Add to cart
`commerce.provider` in the footer config:

| Provider | Behaviour | Risk |
|---|---|---|
| `demo` | No network; cart badge increments. For design review. | none |
| `link` (**recommended to launch**) | Add to Cart sends the shopper to `productUrl` (your real Squarespace product page) where native checkout takes over. | none |
| `squarespace` | `POST /api/commerce/shopping-cart/entries` with `itemId`, `sku`, `quantity` and the `crumb` cookie, same-origin. | **That endpoint is undocumented. I could not verify it against a live store from here.** Open your product page → DevTools → Network → press the native *Add to Cart* → copy the exact request into `squarespaceAdd()` in `src/js/commerce.js` before relying on it. |

Subscribe & Save requires a Squarespace **subscription product/variant**; put its SKU in `subscribeSku`. Flavour variants → `flavorSkus`.

## 4 · Pre-launch checklist
- [ ] Real GLB, hero videos/posters, lifestyle photos in place (`docs/ASSETS.md`)
- [ ] `showPlaceholderTags: false`
- [ ] Prices, subscription terms, shipping/returns copy, flavours (or delete the flavour block)
- [ ] All `[bracketed]` copy replaced; FAQ answers approved; **counsel-approved supplement disclaimer** in the buy box and footer
- [ ] Reviews/UGC only from real customers (`public/data/*.json` or your review app)
- [ ] Policy/contact/social links in `links`
- [ ] Test on a real iPhone (Safari) and a mid-range Android; run PageSpeed Insights on the live URL
- [ ] Verify the cart provider end-to-end with a real test order
