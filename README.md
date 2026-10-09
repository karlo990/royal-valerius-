# Royal Crest Academy — Website

Science · Innovation · Skill — Bikita, Masvingo, Zimbabwe.

A fast, dependency-free static website: plain HTML, CSS and JavaScript, deployed on Vercel.

## Structure
| Path | Purpose |
|------|---------|
| `index.html` | Home page (all sections) |
| `404.html` | Custom error page (served automatically by Vercel) |
| `assets/css/styles.css` | All styles — design tokens (colours, type, spacing) are at the top in `:root` |
| `assets/js/main.js` | Header, mobile menu, scroll reveals, parallax, gallery lightbox, enquiry form, WhatsApp prompt |
| `assets/img/` | Optimised WebP images in responsive sizes |
| `assets/fonts/` | Self-hosted Newsreader and Plus Jakarta Sans (latin subset) |
| `vercel.json` | Security and caching headers |
| `robots.txt`, `sitemap.xml` | SEO |
| `studio/` | **Flyer Studio**: makes subject, tutoring, quiz and chemistry flyers. See `studio/README.md` |

## Enquiry form
The admissions form validates the fields and then opens WhatsApp with the enquiry pre-filled,
addressed to the number in `WHATSAPP_NUMBER` at the top of `assets/js/main.js`. Nothing is sent
until the parent presses send in WhatsApp. If the phone number changes, update it in
`assets/js/main.js` and search `index.html` for `263714404090` / `+263 71 440 4090`.

## Local preview
```bash
npx http-server . -p 8080
```
Then open http://localhost:8080.

## Deploy
Push to the GitHub repository connected to Vercel; it deploys automatically. No build step is needed.

## Contact
+263 71 440 4090 · www.royalcrest.co.zw · Bikita, Masvingo, Zimbabwe
