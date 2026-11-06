# DishDor — ديش دور

Egyptian home-kitchen food brand serving New Cairo. This folder is a Hallmark rebuild of the
marketing site: same brand, same facts, new structure. Static HTML, CSS and vanilla JS, no build
step.

## The business

| | |
|---|---|
| **Name** | ديش دور — DishDor |
| **Tagline** | Home-cooked comfort, right at your door. |
| **What it is** | A home kitchen cooking Egyptian food to order, delivered hot |
| **Ordering** | WhatsApp only — [+20 155 005 7738](https://wa.me/201550057738) |
| **Delivery areas** | مدينتي والرحاب · الشروق ووصال · التجمع الأول والخامس |
| **Instagram** | [@dish.dor](https://www.instagram.com/dish.dor) |
| **Facebook** | [ديش دور](https://www.facebook.com/share/1ExXAiUyje/) |
| **Proof** | 20K+ followers; real kitchen photography |

## Never invent

These are not given and stay absent until the owner supplies them: prices, menu items by name,
ratings, review quotes, delivery fees, minimum order, prep time, opening hours, payment methods,
and customer counts beyond the 20K+ follower figure the owner publishes.

## The site

- One page, `index.html`, with `assets/css/tokens.css` (brand tokens), `assets/css/base.css`
  (reset, container, reduced motion) and `assets/css/style.css` (the stamp, then the page).
- `assets/js/main.js` holds the drawer, ticker, reveal, the menu dialog, the gallery lightbox,
  the active-section marker and the footer year.
- `assets/img/` is the owner's real photography, menu sheet, brochure and logo. Nothing generated.
- Ordering leaves the site for WhatsApp; there is no cart, checkout or backend.

## Running it

```bash
npm run serve     # npx http-server . -p 4173 -c-1
```

Or open `index.html` directly. The Instagram embed needs the network; without it the fallback
link still works.

## Media pipeline

Originals live in `assets/originals/`. Run `npm run media` (after `cd tools && npm install` once)
to regenerate the WebP variants and `assets/js/media-catalog.js`. The logo set comes from
`npm run logo`.

## Known gaps

- `dishdor.com` is chosen but not purchased, so there is no canonical URL and no sitemap yet.
- AEO/GEO content and structured-data expansion are deliberately not started.
- An admin panel (Supabase, `/admin`) is deferred; the site is edited in place for now.
