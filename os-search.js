/* ARC-007 Open Studio Search — embeddable build (Sam 2026-06-19).
   Runs INSIDE the gated Thinkific page (learning.makeryarts.com) so the nested
   Vimeo player satisfies the domain-lock. Data = public snippets (Rex spec). */
(function(){
  var root=document.getElementById('os-search-root'); if(!root){return;}
  var st=document.createElement('style'); st.textContent="\n  :root {\n    --brand-teal: #006472;\n    --ink: #1d1d1d;\n    --muted: #5f6b6d;\n    --line: #d9e0e1;\n    --bg: #ffffff;\n    --hit: #eef6f7;\n    --mark: #ffe9a8;\n  }\n  * { box-sizing: border-box; }\n  html, body { margin: 0; }\n  body {\n    font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;\n    color: var(--ink);\n    background: var(--bg);\n    line-height: 1.45;\n  }\n  .wrap { max-width: 920px; margin: 0 auto; padding: 18px 16px 56px; }\n  h1 { font-size: 1.2rem; margin: 0 0 3px; }\n  .sub { color: var(--muted); font-size: 0.85rem; margin: 0 0 16px; }\n\n  /* Player sits at the top and stays in view while scrolling results. */\n  .player-sticky { position: sticky; top: 0; z-index: 5; background: var(--bg); padding-top: 6px; }\n  .player-shell {\n    position: relative; width: 100%; aspect-ratio: 16 / 9;\n    background: #000; border-radius: 8px; overflow: hidden;\n  }\n  .player-shell iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }\n  .now-playing {\n    font-size: 0.8rem; color: var(--muted); margin: 6px 2px 12px;\n    min-height: 1.1em; font-variant-numeric: tabular-nums;\n  }\n  .now-playing b { color: var(--ink); font-weight: 600; }\n\n  .search-row { display: flex; gap: 8px; margin-bottom: 8px; }\n  #q {\n    flex: 1; padding: 12px 14px; font-size: 1rem;\n    border: 1px solid var(--line); border-radius: 8px; outline: none;\n  }\n  #q:focus { border-color: var(--brand-teal); box-shadow: 0 0 0 3px rgba(0,100,114,0.12); }\n  .count { color: var(--muted); font-size: 0.8rem; margin: 0 0 12px; min-height: 1em; }\n\n  ul.results { list-style: none; margin: 0; padding: 0; }\n  li.result {\n    border: 1px solid var(--line); border-radius: 8px;\n    padding: 12px 14px; margin-bottom: 10px; cursor: pointer;\n    transition: background 0.12s ease, border-color 0.12s ease;\n  }\n  li.result:hover, li.result:focus-within { background: var(--hit); border-color: var(--brand-teal); }\n  .r-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }\n  .r-meta { min-width: 0; }\n  .r-project {\n    color: var(--muted); font-size: 0.74rem; text-transform: uppercase;\n    letter-spacing: 0.04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\n  }\n  .r-project .yr { color: var(--brand-teal); }\n  .r-badge {\n    display: inline-block; font-size: 0.64rem; text-transform: uppercase;\n    letter-spacing: 0.04em; color: var(--muted); border: 1px solid var(--line);\n    border-radius: 4px; padding: 0 5px; margin-left: 6px; vertical-align: 1px;\n  }\n  .r-title { font-weight: 600; margin-top: 1px; }\n  .r-time {\n    flex: 0 0 auto; font-variant-numeric: tabular-nums;\n    color: var(--brand-teal); font-weight: 600; font-size: 0.9rem;\n  }\n  .r-snippet { color: var(--ink); font-size: 0.92rem; margin-top: 4px; }\n  .r-snippet.empty-snip { color: var(--muted); font-style: italic; }\n  mark { background: var(--mark); padding: 0 1px; border-radius: 2px; }\n\n  .r-actions { display: flex; gap: 16px; align-items: center; margin-top: 9px; flex-wrap: wrap; }\n  .r-jump { font-size: 0.82rem; color: var(--brand-teal); font-weight: 600; }\n  .r-lesson {\n    font-size: 0.82rem; color: var(--brand-teal); text-decoration: none;\n    border-bottom: 1px solid var(--brand-teal); padding-bottom: 1px;\n  }\n  .r-lesson:hover { background: var(--hit); }\n\n  .note { color: var(--muted); font-style: italic; padding: 10px 2px; }\n  .hint { color: var(--muted); padding: 14px 2px; font-size: 0.92rem; }\n  .hint b { color: var(--ink); }\n  .err { color: #8a1f1f; padding: 12px 14px; border: 1px solid #e6c4c4; border-radius: 8px; background: #fbf1f1; }\n"; document.head.appendChild(st);
  root.innerHTML="<div class=\"wrap\">\n  <h1>Open Studio \u2014 search the library</h1>\n  <p class=\"sub\">Search every project and Office Hours session by technique, tool, stone, or moment \u2014 then jump straight to that second.</p>\n\n  <div class=\"player-sticky\">\n    <div class=\"player-shell\">\n      <iframe id=\"vimeo\"\n              src=\"https://player.vimeo.com/video/1076987319?title=0&byline=0&portrait=0&dnt=1\"\n              allow=\"autoplay; fullscreen; picture-in-picture\"\n              referrerpolicy=\"strict-origin-when-cross-origin\"\n              title=\"Open Studio video player\"></iframe>\n    </div>\n    <div class=\"now-playing\" id=\"nowPlaying\"></div>\n  </div>\n\n  <div class=\"search-row\">\n    <input id=\"q\" type=\"search\" placeholder=\"Try \u201cbezel setting\u201d, \u201cannealing\u201d, \u201cpatina\u201d, \u201criveting\u201d\u2026\"\n           autocomplete=\"off\" autocapitalize=\"off\" spellcheck=\"false\" aria-label=\"Search the Open Studio library\">\n  </div>\n  <p class=\"count\" id=\"count\" aria-live=\"polite\"></p>\n  <ul class=\"results\" id=\"results\"></ul>\n</div>";
})();
(function () {
  "use strict";

  var BUNDLE_URL = "https://learning.makeryarts.com/bundles/open-studio-community";
  var MAX_RESULTS = 80;          // cap rendered cards; count shows the true total
  var SECTION_MULT = [1.0, 0.85, 0.95]; // [detailed, phase, question] — Detailed > Phase

  var resultsEl = document.getElementById("results");
  var countEl   = document.getElementById("count");
  var qEl       = document.getElementById("q");
  var npEl      = document.getElementById("nowPlaying");

  var DATA = null;     // reconstructed records + term lookup
  var player = null;
  var currentVideo = null;

  // ---------- load + reconstruct ----------
  fetch("https://fwwatson.github.io/verbose-eureka/search-data.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (p) { DATA = reconstruct(p); ready(); })
    .catch(function (e) {
      resultsEl.innerHTML = '<li class="err">Could not load the search index (' +
        String(e.message || e) + '). If this persists, let Francesca know.</li>';
    });

  function wordSet(s) {
    var set = Object.create(null);
    var parts = s.split(/[^a-z0-9']+/);
    for (var i = 0; i < parts.length; i++) { if (parts[i]) set[parts[i]] = true; }
    return set;
  }

  function reconstruct(p) {
    var P = p.projects, V = p.videos;
    var recs = new Array(p.records.length);
    for (var i = 0; i < p.records.length; i++) {
      var row = p.records[i];               // [proj,year,sec,vid,ts,title,snippet]
      var project = P[row[0]], title = row[5], snippet = row[6];
      var pl = project.toLowerCase(), tl = title.toLowerCase(), sl = snippet.toLowerCase();
      recs[i] = {
        project: project, year: row[1], sec: row[2],
        vid: V[row[3]], ts: row[4], title: title, snippet: snippet,
        pl: pl, tl: tl, sl: sl,                 // substrings (typed-token + phrases)
        pw: wordSet(pl), tw: wordSet(tl), sw: wordSet(sl) // word sets (expansion garbles)
      };
    }
    return { recs: recs, terms: p.terms || {}, lessons: p.lessons || {},
             sectionLabels: p.section_labels || ["Detailed","Phase","Question"] };
  }

  function ready() {
    player = new Vimeo.Player(document.getElementById("vimeo"));
    countEl.textContent = DATA.recs.length.toLocaleString() + " moments indexed across the library.";
    showHint();
    qEl.addEventListener("input", debounce(function () { runSearch(qEl.value); }, 110));
    qEl.focus();
  }

  // ---------- term-map query expansion ----------
  // Correct spelling (the canonical) also finds garbled caption variants in
  // snippets; a typed variant also pulls in its canonical + siblings.
  function expandToken(t) {
    var set = Object.create(null); set[t] = true;
    var terms = DATA.terms;
    for (var key in terms) {
      var g = terms[key];                 // { canon, forms:[...] }
      var all = g.forms.concat(key);
      var hit = (t === key) || all.indexOf(t) !== -1;
      if (!hit && t.length >= 4 && key.indexOf(t) !== -1) hit = true;
      if (hit) { for (var j = 0; j < all.length; j++) set[all[j]] = true; }
    }
    return Object.keys(set);
  }

  function tokenize(q) {
    return q.toLowerCase().split(/[^a-z0-9'-]+/).filter(function (w) { return w.length >= 2; });
  }

  // ---------- search + rank ----------
  function runSearch(raw) {
    var q = (raw || "").trim();
    var tokens = tokenize(q);
    if (!tokens.length) { showHint(); return; }

    var phrase = q.toLowerCase();
    var exp = tokens.map(expandToken);     // expansions per token

    var hits = [];
    var recs = DATA.recs;
    for (var i = 0; i < recs.length; i++) {
      var r = recs[i];
      var score = 0, qualifies = true;

      for (var ti = 0; ti < tokens.length; ti++) {
        var forms = exp[ti], typed = tokens[ti], best = 0, direct = false;
        for (var fi = 0; fi < forms.length; fi++) {
          var f = forms[fi];
          if (f === typed) {
            // Typed token: substring match (user controls their own spelling).
            if (r.tl.indexOf(f) !== -1)      { best = Math.max(best, 3.0); direct = true; }
            else if (r.pl.indexOf(f) !== -1) { best = Math.max(best, 2.5); direct = true; }
            else if (r.sl.indexOf(f) !== -1) { best = Math.max(best, 1.5); direct = true; }
          } else {
            // Auto-expanded caption garble: strict — whole-word for single words
            // (so "ele"/"nas" can't bleed into "select"/unrelated text), substring
            // for multi-word phrases (those are distinctive enough).
            var multi = f.indexOf(" ") !== -1;
            if (multi ? r.tl.indexOf(f) !== -1 : r.tw[f])      { best = Math.max(best, 3.0); }
            else if (multi ? r.pl.indexOf(f) !== -1 : r.pw[f]) { best = Math.max(best, 2.5); }
            else if (multi ? r.sl.indexOf(f) !== -1 : r.sw[f]) { best = Math.max(best, 1.5); }
          }
        }
        if (best === 0) { qualifies = false; break; }
        score += best * (direct ? 1.0 : 0.8);
      }
      if (!qualifies) continue;

      if (tokens.length > 1) {
        if (r.tl.indexOf(phrase) !== -1) score += 4;
        else if (r.sl.indexOf(phrase) !== -1) score += 2;
      }
      score *= SECTION_MULT[r.sec] || 1.0;
      hits.push({ r: r, s: score });
    }

    hits.sort(function (a, b) {
      if (b.s !== a.s) return b.s - a.s;
      if (b.r.year !== a.r.year) return b.r.year - a.r.year; // newer first
      return a.r.ts - b.r.ts;
    });

    render(hits, tokens, q);
  }

  // ---------- render ----------
  function render(hits, tokens, q) {
    resultsEl.innerHTML = "";
    var total = hits.length;
    if (!total) {
      countEl.textContent = "No moments match “" + q + "”.";
      var li = document.createElement("li");
      li.className = "note";
      li.textContent = "Try a single technique or tool word — spelling variants are handled automatically.";
      resultsEl.appendChild(li);
      return;
    }
    var shown = Math.min(total, MAX_RESULTS);
    countEl.textContent = (total > shown ? "Showing top " + shown + " of " + total : total + (total === 1 ? " result" : " results"));

    var frag = document.createDocumentFragment();
    for (var i = 0; i < shown; i++) {
      frag.appendChild(card(hits[i].r, tokens));
    }
    resultsEl.appendChild(frag);
  }

  function card(r, tokens) {
    var li = document.createElement("li");
    li.className = "result";
    li.tabIndex = 0;

    var hasSnip = !!r.snippet;
    var badge = DATA.sectionLabels[r.sec] || "";
    var lessonUrl = DATA.lessons[r.vid] || BUNDLE_URL;

    li.innerHTML =
      '<div class="r-top">' +
        '<div class="r-meta">' +
          '<div class="r-project">' + esc(r.project) + ' <span class="yr">· ' + r.year + '</span>' +
            (badge ? '<span class="r-badge">' + badge + '</span>' : '') + '</div>' +
          '<div class="r-title">' + hi(r.title, tokens) + '</div>' +
        '</div>' +
        '<div class="r-time">' + fmt(r.ts) + '</div>' +
      '</div>' +
      '<div class="r-snippet' + (hasSnip ? '' : ' empty-snip') + '">' +
        (hasSnip ? hi(r.snippet, tokens) : 'No transcript preview — title only on this file.') +
      '</div>' +
      '<div class="r-actions">' +
        '<span class="r-jump">▶ Jump to this moment</span>' +
        '<a class="r-lesson" href="' + esc(lessonUrl) + '" target="_top" rel="noopener">Open the full lesson ↗</a>' +
      '</div>';

    li.addEventListener("click", function () { jumpTo(r); });
    li.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jumpTo(r); }
    });
    var lessonLink = li.querySelector(".r-lesson");
    lessonLink.addEventListener("click", function (e) { e.stopPropagation(); });
    return li;
  }

  // ---------- nested player jump (freeze-safe discrete seek) ----------
  function jumpTo(r) {
    setNow("Loading " + r.project + " — " + r.title + " @ " + fmt(r.ts) + "…");
    var seekAndPlay = function () {
      return player.setCurrentTime(r.ts)
        .then(function () { return player.play(); })
        .then(function () { setNow('<b>' + esc(r.project) + '</b> — ' + esc(r.title) + ' · ' + fmt(r.ts)); })
        .catch(function (e) { reportPlayErr(r, e); });
    };
    if (r.vid !== currentVideo) {
      player.loadVideo(Number(r.vid))
        .then(function () { currentVideo = r.vid; return seekAndPlay(); })
        .catch(function (e) { reportPlayErr(r, e); });
    } else {
      seekAndPlay();
    }
    document.querySelector(".player-sticky").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function reportPlayErr(r, e) {
    var msg = (e && e.message) ? e.message : String(e);
    setNow('Could not play this video (' + esc(msg) + '). If you see a privacy message, this host needs to be on the Vimeo embed whitelist.');
  }

  // ---------- helpers ----------
  function showHint() {
    countEl.textContent = DATA.recs.length.toLocaleString() + " moments indexed across the library.";
    resultsEl.innerHTML =
      '<li class="hint">Start typing to search. Each result is a <b>moment</b> in a lesson — ' +
      'click it to jump to that exact second in the player above, or open the full lesson for handouts and the complete index.</li>';
  }
  function setNow(html) { npEl.innerHTML = html; }
  function fmt(sec) {
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    var mm = (h && m < 10 ? "0" : "") + m, ss = (s < 10 ? "0" : "") + s;
    return (h ? h + ":" : "") + mm + ":" + ss;
  }
  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Highlight any typed token (whole-token, case-insensitive) in escaped text.
  function hi(text, tokens) {
    var safe = esc(text);
    if (!tokens || !tokens.length) return safe;
    var uniq = tokens.filter(function (t, i) { return tokens.indexOf(t) === i && t.length >= 2; })
                     .sort(function (a, b) { return b.length - a.length; })
                     .map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
    if (!uniq.length) return safe;
    try {
      return safe.replace(new RegExp("(" + uniq.join("|") + ")", "gi"), "<mark>$1</mark>");
    } catch (e) { return safe; }
  }
  function debounce(fn, ms) {
    var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }
})();
