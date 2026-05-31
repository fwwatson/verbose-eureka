#!/usr/bin/env python3
"""
build.py — Open Studio subscriber-facing static index, dual-target builder.

Reads:  catalogue v3 xlsx (path passed as --catalogue or default below)
Writes:
  - index.html              (Path A target: complete HTML doc, noindex meta,
                             target="_top" on every link; ready to deploy
                             to GitHub Pages and load inside an iframe.)
  - path_b_fragment.html    (Path B target: body-inner fragment with inline
                             <style> block at the top, suitable to paste
                             directly into the Thinkific Text lesson body.
                             Same content rendering as Path A.)

Both targets render the same content from the same data source. Envelope
differs by target only. This is load-bearing for the two-path test's
apples-to-apples premise.

Regen workflow (both maintenance demos use this):
  1. Edit Work Product/Curriculum/OpenStudio_Archive_Catalogue_v3_*.xlsx
     (or supersede with v4 and update --catalogue path).
  2. Run:    python3 build.py
  3. Path A: git add -A && git commit -m "regen" && git push
  4. Path B: copy contents of path_b_fragment.html, replace Thinkific
             lesson body in the editor, save.

Watch items at scale (from Rex's brief):
  - target="_top" on every link is NON-NEGOTIABLE for Path A. Without it
    the link loads INSIDE the iframe stripped of Thinkific chrome —
    silently broken UX, no error thrown. Enforced below by render_link().
  - Fixed iframe height is fine at 58 entries. Revisit if catalogue
    grows past ~200.
  - Outcome A iframe support is plan-tier dependent. Re-check at any
    plan change.

Author: Sam (Builder), 2026-05-31
"""
import argparse
import html
import sys
from pathlib import Path

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

# Calendar order for sorting within year. Captures both clean months and
# the one observed compound entry ("March-April (combined slot)").
MONTH_ORDER = {
    "January": 1, "February": 2, "March": 3, "April": 4,
    "May": 5, "June": 6, "July": 7, "August": 8,
    "September": 9, "October": 10, "November": 11, "December": 12,
    "March-April (combined slot)": 3.5,
    "uncertain": 99,
    None: 99,
}


def load_projects(catalogue_path: Path) -> list[dict]:
    """Read catalogue v3, filter to Category == 'Project', return one dict per project."""
    wb = openpyxl.load_workbook(catalogue_path, data_only=True)
    ws = wb["Catalogue"]
    rows = list(ws.iter_rows(min_row=2, values_only=True))
    projects = []
    for r in rows:
        if (r[COL_CATEGORY] or "").strip() != "Project":
            continue
        urls = [u.strip() for u in (r[COL_THINKIFIC_URL] or "").split(",") if u.strip()]
        projects.append({
            "num": r[COL_NUM],
            "year": str(r[COL_YEAR]),
            "month": r[COL_MONTH],
            "date_confidence": r[COL_DATE_CONFIDENCE] or "",
            "title": (r[COL_STUDENT_FACING_TITLE] or "").strip(),
            "parts": r[COL_PARTS] or 1,
            "total_runtime": (r[COL_TOTAL_RUNTIME] or "").strip(),
            "urls": urls,
        })
    return projects


def date_display(month: str, year: str, date_confidence: str) -> str:
    """Year-only if uncertain (per brief's fuzzy-month rule). Else 'Month Year'."""
    if (date_confidence or "").lower().startswith("uncertain"):
        return year
    if not month or month == "uncertain":
        return year
    return f"{month} {year}"


def render_link(url: str, label: str, with_target_top: bool) -> str:
    """Anchor tag. target='_top' on Path A; same rendering for Path B if
    with_target_top=True (no-op outside an iframe but harmless and keeps
    the apples-to-apples promise clean)."""
    target_attr = ' target="_top" rel="noopener"' if with_target_top else ""
    return f'<a href="{html.escape(url)}"{target_attr}>{html.escape(label)}</a>'


def render_entry(p: dict, with_target_top: bool) -> str:
    """Render one project as a list item. Same shape for both paths."""
    date_str = date_display(p["month"], p["year"], p["date_confidence"])
    runtime = p["total_runtime"] or ""
    parts = p["parts"]

    # Format note + link(s)
    if len(p["urls"]) > 1:
        # Multi-URL case (3 projects only): Journal Making, Fold-formed Pendant,
        # The Hollow Form Pendant Project. Render as Part I / Part II / ... links.
        part_links = " · ".join(
            render_link(u, f"Part {roman(i+1)}", with_target_top)
            for i, u in enumerate(p["urls"])
        )
        link_html = f'{part_links}'
        format_note = f"{parts} parts"
    elif parts > 1:
        # Multi-part Vimeo broadcast consolidated into one Thinkific lesson.
        link_html = render_link(p["urls"][0], "Open lesson", with_target_top)
        format_note = f"{parts} parts"
    else:
        link_html = render_link(p["urls"][0], "Open lesson", with_target_top)
        format_note = "single session"

    title_html = html.escape(p["title"])
    meta_bits = [date_str, runtime, format_note]
    meta = " · ".join(b for b in meta_bits if b)

    return (
        f'    <li class="entry">'
        f'<span class="entry-title">{title_html}</span> '
        f'<span class="entry-meta">{html.escape(meta)}</span> '
        f'<span class="entry-link">{link_html}</span>'
        f'</li>'
    )


def roman(n: int) -> str:
    return {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V"}.get(n, str(n))


def render_body_inner(projects: list[dict], with_target_top: bool) -> str:
    """Render the body-inner HTML (year-grouped list). Same for both targets."""
    # Sort: year ascending numeric, then month calendar order within year
    sorted_projects = sorted(
        projects,
        key=lambda p: (int(p["year"]), MONTH_ORDER.get(p["month"], 99), p["num"]),
    )
    # Group by year
    by_year: dict[str, list[dict]] = {}
    for p in sorted_projects:
        by_year.setdefault(p["year"], []).append(p)

    sections = []
    for year in sorted(by_year.keys(), key=int):
        items = "\n".join(render_entry(p, with_target_top) for p in by_year[year])
        sections.append(
            f'<section class="year">\n'
            f'  <h2 class="year-heading">{year}</h2>\n'
            f'  <ul class="entries">\n{items}\n  </ul>\n'
            f'</section>'
        )

    intro = (
        f'<p class="intro">{len(projects)} projects from the Open Studio archive, '
        f'grouped by year. Click any project to open the lesson in Thinkific.</p>'
    )
    return intro + "\n\n" + "\n\n".join(sections)


# Shared styling — same visual for both paths
STYLE_CSS = """
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
       max-width: 760px; margin: 0 auto; padding: 1.5em 1em;
       color: #2a2a2a; line-height: 1.5; }
.intro { color: #555; margin-bottom: 1.5em; font-size: 0.95em; }
.year { margin-bottom: 2em; }
.year-heading { font-size: 1.3em; font-weight: 600; color: #1a1a1a;
                border-bottom: 1px solid #ddd; padding-bottom: 0.3em;
                margin-bottom: 0.6em; }
.entries { list-style: none; padding: 0; margin: 0; }
.entry { padding: 0.5em 0; border-bottom: 1px solid #f0f0f0;
         display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5em 1em; }
.entry-title { font-weight: 500; flex: 1 1 60%; }
.entry-meta { color: #777; font-size: 0.85em; flex: 1 1 30%; }
.entry-link { flex: 0 0 auto; font-size: 0.9em; }
.entry-link a { color: #0a5d8c; text-decoration: none; }
.entry-link a:hover { text-decoration: underline; }
@media (max-width: 480px) {
  .entry { flex-direction: column; gap: 0.2em; }
  .entry-meta { font-size: 0.8em; }
}
""".strip()


def render_path_a(body_inner: str) -> str:
    """Path A target: complete HTML5 doc, noindex meta, full envelope."""
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
</body>
</html>
"""


def render_path_b(body_inner: str) -> str:
    """Path B target: body-inner fragment with inline <style> at top.
    Suitable for paste into a Thinkific Text lesson body editor.
    No <!DOCTYPE>, no <html>, no <head>, no <body> — Thinkific provides those."""
    return f"""<style>
{STYLE_CSS}
</style>

{body_inner}
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--catalogue",
        default="../Makery Operations/Work Product/Curriculum/OpenStudio_Archive_Catalogue_v3_2026-05-30.xlsx",
        help="Path to catalogue v3 xlsx",
    )
    parser.add_argument(
        "--out-dir",
        default=".",
        help="Output directory (default: current dir)",
    )
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    projects = load_projects(Path(args.catalogue))
    print(f"Loaded {len(projects)} projects from catalogue.")

    # Render once per target. Same body content; envelope differs.
    body_a = render_body_inner(projects, with_target_top=True)
    body_b = render_body_inner(projects, with_target_top=False)

    path_a_out = out_dir / "index.html"
    path_b_out = out_dir / "path_b_fragment.html"
    path_a_out.write_text(render_path_a(body_a), encoding="utf-8")
    path_b_out.write_text(render_path_b(body_b), encoding="utf-8")
    print(f"Wrote {path_a_out} ({path_a_out.stat().st_size} bytes)")
    print(f"Wrote {path_b_out} ({path_b_out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
