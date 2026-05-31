# Static page

Generated HTML from a private xlsx data source plus a directory of project
card images. Deployed to GitHub Pages.

The page is intentionally generic. No public-facing branding, no titles in
the repo description, no sitemap, no telemetry. The site responds with
`noindex, nofollow` and a deny-all `robots.txt` for compliant crawlers.

## Build

```
python3 build.py
```

Produces `index.html` from the catalogue and the contents of `./images/`.
Entries without a matching card image render as brand-palette placeholders.

## Add or update a card

Place a JPEG (or PNG) in `./images/` following the naming convention
`<NNN>-<short-slug>.<ext>` — where `<NNN>` is the catalogue project number
zero-padded to three digits. Example: `001-the-big-ass-ring.jpg`.

The build script picks images by the number prefix; the slug portion is for
your eye, not load-bearing. If multiple files share the same project number
the script picks the first alphabetically and warns.

### Image guidance

- Target ~600–800 px wide, square aspect ratio (Canva cards may be other
  ratios — center-cropped by default; re-export if a composition would be
  lost to crop).
- JPEG quality 85 is the default. PNG only if a specific card needs text
  crispness that JPEG can't hold.
- **Hard size limit: 250 KB per image.** Builds fail with a clear error
  naming the file and its size. Re-export the card smaller before
  re-running.

## Regen

```
python3 build.py
git add -A && git commit -m "regen" && git push
```

GitHub Pages auto-deploys on push to `main`. CDN propagation is roughly
30 seconds after push.
