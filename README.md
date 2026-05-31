# Static page

Generated HTML from a private xlsx data source. Deployed to GitHub Pages.

The page is intentionally generic. No public-facing branding, no titles in
the repo description, no sitemap, no telemetry. The site responds with
`noindex, nofollow` and a deny-all `robots.txt` for compliant crawlers.

## Build

```
python3 build.py
```

Produces `index.html` (deploys via Pages) and `path_b_fragment.html`
(reference output for a parallel-test comparison, not deployed).

## Regen

After updating the source xlsx (kept outside this repo):

```
python3 build.py
git add -A && git commit -m "regen" && git push
```

GitHub Pages auto-deploys on push to `main`.
