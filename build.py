#!/usr/bin/env python3
"""
build.py — Open Studio static index, Path A production builder.

Reads:
  - catalogue v3 xlsx (default --catalogue path below, override per environment)
  - ./images/ directory (default --images-dir; project images keyed by number-prefix)

Writes:
  - index.html (complete HTML document, noindex meta, target="_top" on every
    link; deploys via GitHub Pages, loads inside an iframe in the Thinkific
    Text lesson, fixed-pixel height parent.)

Renders 58 project entries as image-anchored rows (square image left + text
right; no bordered card). Year-grouped, calendar-ordered within year, no
filter/search/sort/tag-grouping anywhere in the served HTML (methodology gate).

YEAR TABS (2026-09-29, Francesca): one year per tab (older short years paired,
max 12 projects per tab) so the page height stays ~2,700 px and the fixed iframe
height in lesson 75598614 does not change month to month. The build prints a
WARNING if any tab exceeds 12 projects -- only then re-measure the height.
Without JavaScript every year still shows as one long list.

# Image discovery

For each project, glob `images/<NNN>-*` where <NNN> is the 3-digit zero-padded
project number from the catalogue. If multiple files match the prefix, pick
the first alphabetical match and warn to stderr (slug portion of filename is
for the human eye, never load-bearing). If no file matches, render the
placeholder version of the entry — a brand-palette block with the project
title rendered prominently and a small "Card coming" label.

# Naming convention

`images/<NNN>-<short-slug>.<ext>`. Examples:
  images/001-the-big-ass-ring.jpg
  images/057-the-hollow-form-pendant.jpg

# Image guidance (documented; size enforced)

  - JPEG quality 85, ~600-800px wide square.
  - PNG allowed if card text crispness needs it (note in README).
  - Square aspect ratio — Canva exports may be 16:9 or portrait; center-crop
    is the default. If center-crop loses a composition, hand-adjust or
    re-export the card.
  - HARD REFUSAL at >250 KB per image (build errors with filename + size).
    Prevents 4MB Canva exports landing unnoticed.

# Regen workflow

1. Add or replace card in ./images/ following the naming convention above.
2. `python3 build.py` (reads catalogue v3 at the configured path).
3. `git add -A && git commit -m "regen" && git push`. GitHub Pages
   auto-deploys on push to main; CDN propagation ~30 seconds.

# Watch items (build-script-level)

  - `target="_top"` on EVERY link is non-negotiable for the iframe-embed
    architecture. Without it the click UX is silently broken (lesson loads
    inside iframe stripped of Thinkific chrome). Enforced below by
    render_link(); do not change unless the iframe-embed architecture itself
    changes.
  - Fixed iframe height stress at scale: image-anchored rows are taller than
    the original text-only rows, so the parent iframe height may need a bump
    from the two-path test's 900px. Reassess at deploy time.
  - Outcome A iframe-embed support is plan-tier dependent on Thinkific's
    side. Re-check at any plan change.

# Author / provenance

Author: Sam (Builder).
Initial test-build: 2026-05-31 (`Sam_to_Jordan_TwoPath_Test_Outcome_2026-05-31.md`).
Production extension: 2026-05-31 (per
`Jordan_to_Sam_OpenStudio_Static_Index_Build_Brief_2026-05-31.md`, folding
Rex's structural spec + Morgan's visual spec).
"""
import argparse
import html
import sys
from pathlib import Path
from typing import Optional


try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl required: pip install openpyxl --break-system-packages")


# --- catalogue column indices (0-indexed, matching openpyxl tuple positions)
COL_NUM = 0
COL_YEAR = 1
COL_MONTH = 2
COL_DATE_CONFIDENCE = 3
COL_TITLE_SOURCE = 4
COL_WORKING_TITLE = 5
COL_BROADCAST_TYPE = 6
COL_CATEGORY = 7
COL_PROJECT_DESCRIPTOR = 8
COL_LED_BY = 9
COL_NON_METALSMITHING = 10
COL_PARTS = 11
COL_TOTAL_RUNTIME = 12
COL_RUNTIME_MIN = 13
COL_CAPTIONS = 14
COL_VIMEO_FOLDER_ID = 15
COL_VIDEO_IDS = 16
COL_FOLDER_URL = 17
COL_UPLOAD_DATES = 18
COL_STUDENT_FACING_TITLE = 19
COL_THINKIFIC_URL = 20
COL_FLAGS_NOTES = 21

MONTH_ORDER = {
    "January": 1, "February": 2, "March": 3, "April": 4,
    "May": 5, "June": 6, "July": 7, "August": 8,
    "September": 9, "October": 10, "November": 11, "December": 12,
    "March-April (combined slot)": 3.5,
    "uncertain": 99,
    None: 99,
}

# Hard size limit per image. Build refuses (does not warn-and-continue).
IMAGE_SIZE_LIMIT_BYTES = 250 * 1024

# Brand palette (Reference/Brand Resources/Brand Colors.png). Used for
# placeholder backgrounds. Deep teal + navy alternated by project number
# parity for visual variety while staying inside the brand palette and
# guaranteeing white-text contrast.
BRAND_DEEP_TEAL = "#006472"
BRAND_NAVY = "#273e69"
PLACEHOLDER_COLORS = [BRAND_DEEP_TEAL, BRAND_NAVY]


def load_projects(catalogue_path: Path) -> list[dict]:
    wb = openpyxl.load_workbook(catalogue_path, data_only=True)
    ws = wb["Catalogue"]
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    projects = []
    for r in rows:
        if (r[COL_CATEGORY] or "").strip() != "Project":
            continue
        urls = [u.strip() for u in (r[COL_THINKIFIC_URL] or "").split(",") if u.strip()]
        projects.append({
            "num": int(r[COL_NUM]),
            "year": str(r[COL_YEAR]),
            "month": r[COL_MONTH],
            "date_confidence": r[COL_DATE_CONFIDENCE] or "",
            "title": (r[COL_STUDENT_FACING_TITLE] or "").strip(),
            "parts": r[COL_PARTS] or 1,
            "total_runtime": (r[COL_TOTAL_RUNTIME] or "").strip(),
            "descriptor": (r[COL_PROJECT_DESCRIPTOR] or "").strip(),
            "led_by": (r[COL_LED_BY] or "").strip(),
            "urls": urls,
        })
    return projects


def date_display(month: str, year: str, date_confidence: str) -> str:
    """Year-only when date is uncertain; otherwise 'Month Year'."""
    if (date_confidence or "").lower().startswith("uncertain"):
        return year
    if not month or month == "uncertain":
        return year
    return f"{month} {year}"


def find_image(images_dir: Path, project_num: int) -> Optional[Path]:
    """Glob images/<NNN>-* and return first alphabetical match.
    Warn to stderr if multiple files match the prefix."""
    if not images_dir.exists():
        return None
    pattern = f"{project_num:03d}-*"
    matches = sorted(images_dir.glob(pattern))
    if not matches:
        return None
    if len(matches) > 1:
        names = [m.name for m in matches]
        print(
            f"WARNING: multiple images match {pattern}: {names}. "
            f"Using {matches[0].name} (first alphabetical).",
            file=sys.stderr,
        )
    return matches[0]


def check_image_size(image_path: Path) -> None:
    """Hard refusal — build errors if image is over the size limit."""
    size = image_path.stat().st_size
    if size > IMAGE_SIZE_LIMIT_BYTES:
        sys.exit(
            f"ERROR: {image_path.name} is {size / 1024:.1f} KB; "
            f"limit is {IMAGE_SIZE_LIMIT_BYTES / 1024:.0f} KB. "
            f"Re-export this card at a smaller size before retrying the build."
        )


def render_image_block(p: dict, image_rel_path: Optional[str]) -> str:
    """Render the square image-left block. Real image when available;
    brand-palette placeholder with title otherwise."""
    if image_rel_path:
        # Real image: alt-text auto-fills from title; lazy-load.
        return (
            f'<div class="entry-image">'
            f'<img src="{html.escape(image_rel_path)}" '
            f'alt="{html.escape(p["title"])}" '
            f'loading="lazy">'
            f'</div>'
        )
    # Placeholder: brand-palette block, title rendered at prominent
    # typography, small "Card coming" label.
    color = PLACEHOLDER_COLORS[p["num"] % len(PLACEHOLDER_COLORS)]
    return (
        f'<div class="entry-image entry-image-placeholder" '
        f'style="background-color:{color};">'
        f'<span class="placeholder-title">{html.escape(p["title"])}</span>'
        f'<span class="placeholder-label">Card coming</span>'
        f'</div>'
    )


def render_text_block(p: dict) -> str:
    """Render the text column. Conditional fields render-or-don't based on
    catalogue data presence per Morgan's spec:
      - Title: always
      - Date (Month Year, or Year-only if uncertain): always
      - Runtime: always
      - Format note: only when multi-part ('N parts')
      - Descriptor: only when populated
      - Led-by: only when not Francesca-led ('with [Guest Name]')
    Multi-part link rendering is inline under metadata."""
    title_html = f'<span class="entry-title">{html.escape(p["title"])}</span>'

    date_str = date_display(p["month"], p["year"], p["date_confidence"])
    runtime = p["total_runtime"] or ""
    date_runtime = " · ".join(b for b in [date_str, runtime] if b)
    date_runtime_html = f'<span class="entry-date-runtime">{html.escape(date_runtime)}</span>'

    # Format note: render only when multi-part
    format_html = ""
    if p["parts"] and p["parts"] > 1:
        format_html = f'<span class="entry-format">{p["parts"]} parts</span>'

    # Descriptor: only when populated
    descriptor_html = ""
    if p["descriptor"]:
        descriptor_html = f'<span class="entry-descriptor">{html.escape(p["descriptor"])}</span>'

    # Led-by: only when not Francesca-led. Strip "Guest: " prefix per the
    # catalogue convention; render as "with [Name]".
    led_by_html = ""
    if p["led_by"] and p["led_by"] != "Francesca-led":
        name = p["led_by"]
        if name.lower().startswith("guest:"):
            name = name.split(":", 1)[1].strip()
        led_by_html = f'<span class="entry-led-by">with {html.escape(name)}</span>'

    # Multi-part inline links (multi-URL case only — 3 projects today).
    multipart_html = ""
    if len(p["urls"]) > 1:
        part_links = " · ".join(
            render_link(u, f"Part {roman(i + 1)}", with_target_top=True)
            for i, u in enumerate(p["urls"])
        )
        multipart_html = f'<span class="entry-multipart-links">{part_links}</span>'

    parts = [title_html, date_runtime_html, format_html, descriptor_html, led_by_html, multipart_html]
    return '<div class="entry-text">' + "".join(p for p in parts if p) + '</div>'


def render_link(url: str, label: str, with_target_top: bool) -> str:
    target_attr = ' target="_top" rel="noopener"' if with_target_top else ""
    return f'<a href="{html.escape(url)}"{target_attr}>{html.escape(label)}</a>'


def roman(n: int) -> str:
    return {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V"}.get(n, str(n))


def render_entry(p: dict, images_dir: Path) -> str:
    """Render one project entry — single-link rows wrap the whole inner
    content in an anchor (entire row clickable); multi-part rows do not
    wrap (per-part inline links carry navigation)."""
    image_rel = None
    image_file = find_image(images_dir, p["num"])
    if image_file:
        check_image_size(image_file)
        image_rel = f"images/{image_file.name}"

    image_block = render_image_block(p, image_rel)
    text_block = render_text_block(p)

    is_multi = len(p["urls"]) > 1
    if is_multi:
        # No row-click wrap; per-part links inside text_block handle navigation.
        return (
            f'<li class="entry entry-multipart">'
            f'<div class="entry-inner">{image_block}{text_block}</div>'
            f'</li>'
        )
    # Single-link entry: wrap entire row contents in a single anchor.
    url = p["urls"][0]
    return (
        f'<li class="entry entry-single">'
        f'<a class="entry-row-link" href="{html.escape(url)}" '
        f'target="_top" rel="noopener">'
        f'{image_block}{text_block}'
        f'</a>'
        f'</li>'
    )



# --- Year tabs (Francesca 2026-09-29) ------------------------------------
# One year per tab so the page height stays roughly constant and the fixed
# iframe height in Thinkific lesson 75598614 never has to change monthly.
# A tab holds at most MAX_PER_TAB projects (a full year of monthly projects).
# The newest year always stands alone (it is still filling). Older years are
# paired newest-first while the pair stays within MAX_PER_TAB
# (today: 2022+2023 = 12 -> one "2022–2023" tab; 2021 alone).
MAX_PER_TAB = 12


def group_year_tabs(by_year: dict) -> list:
    years = list(by_year)  # newest first
    tabs = []
    i = 0
    while i < len(years):
        group = [years[i]]
        if i > 0:  # never merge the current (newest) year
            while (i + len(group) < len(years)
                   and sum(len(by_year[y]) for y in group) + len(by_year[years[i + len(group)]]) <= MAX_PER_TAB):
                group.append(years[i + len(group)])
        if len(group) == 1:
            tabs.append((group[0], group[0], group))
        else:
            tabs.append((f"{group[-1]}-{group[0]}", f"{group[-1]}\u2013{group[0]}", group))
        i += len(group)
    over = [(t[1], sum(len(by_year[y]) for y in t[2])) for t in tabs
            if sum(len(by_year[y]) for y in t[2]) > MAX_PER_TAB]
    if over:
        print("WARNING — TAB OVER 12 PROJECTS, the Thinkific lesson 75598614 iframe "
              f"height must be re-measured and raised: {over}", file=sys.stderr)
    return tabs


def render_body_inner(projects: list[dict], images_dir: Path) -> str:
    # Reverse-chronological: most recent first (Francesca 2026-06-24).
    # Years descending; months descending within a year; num breaks ties.
    # Entries with an uncertain/unknown month sort to the BOTTOM of their year
    # (we can't claim they're recent) — reverse=True flips the whole key, so
    # uncertain months map to -1 to stay last under the flip.
    def _month_key(p: dict):
        m = MONTH_ORDER.get(p["month"], 99)
        return -1 if m == 99 else m

    sorted_projects = sorted(
        projects,
        key=lambda p: (int(p["year"]), _month_key(p), p["num"]),
        reverse=True,
    )
    by_year: dict[str, list[dict]] = {}
    for p in sorted_projects:
        by_year.setdefault(p["year"], []).append(p)

    tabs = group_year_tabs(by_year)
    tab_buttons, panels = [], []
    for i, (key, label, years) in enumerate(tabs):
        n = sum(len(by_year[y]) for y in years)
        selected = "true" if i == 0 else "false"
        tab_buttons.append(
            f'<button type="button" role="tab" id="tab-{key}" class="ytab" '
            f'aria-selected="{selected}" aria-controls="panel-{key}" tabindex="{0 if i == 0 else -1}">'
            f'<span class="ytab-year">{html.escape(label)}</span>'
            f'<span class="ytab-count">{n} project{"" if n == 1 else "s"}</span></button>'
        )
        items = []
        for y in years:
            if len(years) > 1:
                items.append(f'<li class="entry sub-year"><h3 class="sub-year-heading">{y}</h3></li>')
            items.extend(render_entry(p, images_dir) for p in by_year[y])
        newer = tabs[i - 1] if i > 0 else None
        older = tabs[i + 1] if i + 1 < len(tabs) else None
        nav = '<nav class="ynav" aria-label="Other years">'
        nav += (f'<button type="button" class="ynav-btn" data-go="{newer[0]}">&larr; Newer: {html.escape(newer[1])}</button>'
                if newer else '<span></span>')
        nav += (f'<button type="button" class="ynav-btn" data-go="{older[0]}">Older: {html.escape(older[1])} &rarr;</button>'
                if older else '<span></span>')
        nav += '</nav>'
        # Panels are NOT hidden in the served HTML: if the script fails, every
        # year still shows (the old one-long-list behaviour). The script hides
        # all but the selected tab.
        panels.append(
            f'<section class="year" role="tabpanel" id="panel-{key}" aria-labelledby="tab-{key}">\n'
            f'  <h2 class="year-heading nojs-only">{html.escape(label)}</h2>\n'
            f'  <ul class="entries">\n' + "\n".join(items) + f'\n  </ul>\n  {nav}\n</section>'
        )
    tablist = '<div class="ytabs" role="tablist" aria-label="Year" hidden>' + "".join(tab_buttons) + '</div>'
    return tablist + "\n\n" + "\n\n".join(panels)

    # Intro paragraph intentionally removed 2026-05-31 — Francesca writes the
    # opening paragraph at the Thinkific lesson level, above the iframe.


# Stylesheet. Image-anchored row pattern; placeholder uses brand-palette
# block with prominent white title and small bottom-right "Card coming" label.
# Mobile (<=480px) keeps image-left but shrinks square to 72px.
STYLE_CSS = """
body { font-family: Georgia, 'Times New Roman', serif;
       max-width: none; margin: 0; padding: 1.25em clamp(12px,3vw,44px); box-sizing: border-box;
       color: #2a2a2a; line-height: 1.5; }
*, *::before, *::after { box-sizing: border-box; }
.year { margin-bottom: 2em; }
.year-heading { font-size: 1.3em; font-weight: 600; color: #1a1a1a;
                border-bottom: 1px solid #ddd; padding-bottom: 0.3em;
                margin-bottom: 0.8em; }
.entries { list-style: none; padding: 0; margin: 0; }
.entry { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.entry:last-child { border-bottom: none; }
.entry-row-link, .entry-inner {
  display: flex; gap: 16px; align-items: stretch;
  color: inherit; text-decoration: none;
}
.entry-image {
  flex: 0 0 320px; width: 320px; height: 180px; aspect-ratio: 16 / 9;
  border-radius: 6px; overflow: hidden; position: relative;
  background-color: #eee;
}
.entry-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
.entry-image-placeholder {
  display: flex; align-items: center; justify-content: center;
  text-align: center; padding: 10px;
}
.placeholder-title {
  color: #fff; font-weight: 600; font-size: 17px;
  line-height: 1.25; word-break: break-word;
}
.placeholder-label {
  position: absolute; bottom: 5px; right: 7px;
  color: #fff; opacity: 0.7; font-size: 10px; font-weight: 400;
  letter-spacing: 0.02em;
}
.entry-text {
  flex: 1; display: flex; flex-direction: column; gap: 3px;
  min-width: 0;
}
.entry-title {
  font-size: 16px; font-weight: 600; color: #1a1a1a; line-height: 1.3;
}
.entry-date-runtime, .entry-format, .entry-descriptor,
.entry-led-by, .entry-multipart-links {
  font-size: 13px; color: #666; line-height: 1.4;
}
.entry-descriptor { color: #555; font-style: italic; }
.entry-led-by { color: #555; }
.entry-multipart-links a { color: #0a5d8c; text-decoration: none; }
.entry-multipart-links a:hover { text-decoration: underline; }
.entry-row-link:hover .entry-title { color: #0a5d8c; }
.entry-row-link:hover .entry-image {
  box-shadow: 0 0 0 2px #0a5d8c;
}
@media (max-width: 600px) {
  .entry-image { flex: 0 0 160px; width: 160px; height: 90px; }
  .placeholder-title { font-size: 12px; line-height: 1.2; }
  .placeholder-label { font-size: 8px; bottom: 3px; right: 4px; }
  .entry-title { font-size: 15px; }
  .entry-date-runtime, .entry-format, .entry-descriptor,
  .entry-led-by, .entry-multipart-links { font-size: 12px; }
  .entry-row-link, .entry-inner { gap: 12px; }
}

/* Refined Classic font roles (Sam 2026-06-24) */
.year-heading, .entry-title, .placeholder-title { font-family: 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif; }
.entry-date-runtime, .entry-format, .entry-led-by, .entry-multipart-links, .placeholder-label { font-family: 'Trebuchet MS', Verdana, Geneva, sans-serif; }

/* Year tabs (2026-09-29) */
.year { margin-bottom: 0; }
.ytabs { display: flex; flex-wrap: wrap; gap: 6px; padding-bottom: 12px; border-bottom: 1px solid #ddd; margin-bottom: 8px; }
.ytab { font: inherit; display: grid; justify-items: center; gap: 1px; min-width: 76px; min-height: 48px; padding: 6px 12px; border: 1px solid #d6dcdc; border-radius: 6px; background: #fff; color: #1a1a1a; cursor: pointer; }
.ytab-year { font-family: 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif; font-size: 18px; font-weight: 600; line-height: 1.2; }
.ytab-count { font-family: 'Trebuchet MS', Verdana, Geneva, sans-serif; font-size: 11px; color: #666; }
.ytab:hover { border-color: #0a5d8c; }
.ytab[aria-selected="true"] { background: #273e69; border-color: #273e69; color: #fff; }
.ytab[aria-selected="true"] .ytab-count { color: #d7deea; }
.ytab:focus-visible, .ynav-btn:focus-visible { outline: 2px solid #f26a36; outline-offset: 2px; }
.entry.sub-year { padding: 14px 0 2px; border-bottom: none; }
.entries .entry.sub-year:first-child { padding-top: 4px; }
.sub-year-heading { margin: 0; font-family: 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif; font-size: 16px; font-weight: 600; color: #555; letter-spacing: 0.02em; }
.ynav { display: flex; justify-content: space-between; gap: 8px; padding-top: 14px; margin-top: 4px; border-top: 1px solid #f0f0f0; }
.ynav-btn { font: 14px 'Trebuchet MS', Verdana, Geneva, sans-serif; min-height: 44px; padding: 8px 14px; border: 1px solid #d6dcdc; border-radius: 6px; background: #fff; color: #0a5d8c; cursor: pointer; }
.ynav-btn:hover { border-color: #0a5d8c; }
.js .nojs-only { display: none; }
html:not(.js) .ynav { display: none; }
[hidden] { display: none !important; }
@media (max-width: 600px) {
  .ytabs { display: grid; grid-template-columns: repeat(3, 1fr); }
  .ytab { min-width: 0; padding: 6px 4px; }
}
""".strip()


TABS_JS = """
(function () {
  document.documentElement.className += ' js';
  var list = document.querySelector('.ytabs');
  if (!list) return;
  var tabs = Array.prototype.slice.call(list.querySelectorAll('.ytab'));
  function select(key, focus) {
    tabs.forEach(function (t) {
      var on = t.id === 'tab-' + key;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t.id.slice(4)); });
    t.addEventListener('keydown', function (e) {
      var j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); select(tabs[j].id.slice(4), true); }
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.ynav-btn'), function (b) {
    b.addEventListener('click', function () {
      select(b.getAttribute('data-go'), true);
      try { list.scrollIntoView({ block: 'start' }); } catch (e) { list.scrollIntoView(); }
    });
  });
  list.hidden = false;
  select(tabs[0].id.slice(4));
})();
""".strip()


def render_html(body_inner: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Library</title>
  <style>
{STYLE_CSS}
  </style>
</head>
<body>
{body_inner}
<script>
{TABS_JS}
</script>
</body>
</html>
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "--catalogue",
        default="../Makery Operations/Work Product/Curriculum/OpenStudio_Archive_Catalogue_v3_2026-05-30.xlsx",
        help="Path to catalogue v3 xlsx",
    )
    parser.add_argument(
        "--images-dir",
        default="images",
        help="Path to images directory (default ./images relative to script)",
    )
    parser.add_argument(
        "--out-dir",
        default=".",
        help="Output directory for index.html (default: current dir)",
    )
    args = parser.parse_args()

    images_dir = Path(args.images_dir).resolve()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    projects = load_projects(Path(args.catalogue))
    print(f"Loaded {len(projects)} projects from catalogue.")

    # Pre-scan images directory: report present vs placeholder counts.
    if images_dir.exists():
        n_with_image = sum(1 for p in projects if find_image(images_dir, p["num"]))
    else:
        n_with_image = 0
        print(f"Note: images directory {images_dir} does not exist; rendering all entries as placeholders.")
    n_placeholder = len(projects) - n_with_image
    print(f"Image inventory: {n_with_image} with card, {n_placeholder} placeholder.")

    body_inner = render_body_inner(projects, images_dir)
    out_path = out_dir / "index.html"
    out_path.write_text(render_html(body_inner), encoding="utf-8")
    print(f"Wrote {out_path} ({out_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
