/* ARC-007 Open Studio Search — embeddable app (Sam 2026-06-19, revert+SRI build).
   Loaded with Subresource Integrity from the small Thinkific footer loader, which runs
   ONLY on the gated search page and defines window.OS_SEARCH_CONFIG (page path, data URL,
   feedback webhook + token + mailto). This file is config-free / public-safe: no webhook
   URL or token is baked in — they arrive at runtime via the global the footer set.
   The app body below is byte-for-byte the jsdom-validated inline app. */
(function () {
  "use strict";
  try {
    var CONFIG = window.OS_SEARCH_CONFIG || {
      DATA_URL: "https://fwwatson.github.io/verbose-eureka/search-data.json",
      FEEDBACK_WEBHOOK_URL: "",
      FEEDBACK_TOKEN: "",
      FEEDBACK_MAILTO: "francesca@makeryarts.com"
    };
    var root = document.getElementById("os-search-root");
    if (!root) { return; }
    if (!(window.Vimeo && window.Vimeo.Player)) {
      root.innerHTML = '<p style="padding:16px;font-family:sans-serif">The video player could not load. Please refresh the page.</p>';
      return;
    }
    boot();

        function boot() {
      try {

        // ---------- styles ----------
        var st = document.createElement("style");
        st.textContent = [
          "#os-search-root{--brand-teal:#006472;--ink:#1d1d1d;--muted:#5f6b6d;--line:#d9e0e1;--bg:#fff;--hit:#eef6f7;--mark:#ffe9a8;}",
          "#os-search-root *{box-sizing:border-box;}",
          "#os-search-root .wrap{max-width:920px;margin:0 auto;padding:18px 16px 56px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:var(--ink);line-height:1.45;}",
          "#os-search-root h1{font-size:1.2rem;margin:0 0 3px;}",
          "#os-search-root .sub{color:var(--muted);font-size:.85rem;margin:0 0 16px;}",
          "#os-search-root .player-sticky{position:sticky;top:0;z-index:5;background:var(--bg);padding-top:6px;}",
          "#os-search-root .player-shell{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;}",
          "#os-search-root .player-shell iframe{position:absolute;inset:0;width:100%;height:100%;border:0;}",
          "#os-search-root .player-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:6px 2px 12px;flex-wrap:wrap;}",
          "#os-search-root .now-playing{font-size:.8rem;color:var(--muted);min-height:1.1em;font-variant-numeric:tabular-nums;}",
          "#os-search-root .now-playing b{color:var(--ink);font-weight:600;}",
          "#os-search-root .im-btn,#os-search-root .r-report{font:inherit;font-size:.78rem;color:var(--brand-teal);background:none;border:1px solid var(--line);border-radius:6px;padding:3px 9px;cursor:pointer;}",
          "#os-search-root .im-btn:hover,#os-search-root .r-report:hover{background:var(--hit);border-color:var(--brand-teal);}",
          "#os-search-root .search-row{display:flex;gap:8px;margin-bottom:8px;}",
          "#os-search-root #os-q{flex:1;padding:12px 14px;font-size:1rem;border:1px solid var(--line);border-radius:8px;outline:none;}",
          "#os-search-root #os-q:focus{border-color:var(--brand-teal);box-shadow:0 0 0 3px rgba(0,100,114,.12);}",
          "#os-search-root .count{color:var(--muted);font-size:.8rem;margin:0 0 12px;min-height:1em;}",
          "#os-search-root ul.results{list-style:none;margin:0;padding:0;}",
          "#os-search-root li.result{border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin-bottom:10px;cursor:pointer;transition:background .12s,border-color .12s;}",
          "#os-search-root li.result:hover,#os-search-root li.result:focus-within{background:var(--hit);border-color:var(--brand-teal);}",
          "#os-search-root .r-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;}",
          "#os-search-root .r-meta{min-width:0;}",
          "#os-search-root .r-project{color:var(--muted);font-size:.74rem;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
          "#os-search-root .r-project .yr{color:var(--brand-teal);}",
          "#os-search-root .r-badge{display:inline-block;font-size:.64rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);border:1px solid var(--line);border-radius:4px;padding:0 5px;margin-left:6px;vertical-align:1px;}",
          "#os-search-root .r-title{font-weight:600;margin-top:1px;}",
          "#os-search-root .r-time{flex:0 0 auto;font-variant-numeric:tabular-nums;color:var(--brand-teal);font-weight:600;font-size:.9rem;}",
          "#os-search-root .r-snippet{color:var(--ink);font-size:.92rem;margin-top:4px;}",
          "#os-search-root .r-snippet.empty-snip{color:var(--muted);font-style:italic;}",
          "#os-search-root mark{background:var(--mark);padding:0 1px;border-radius:2px;}",
          "#os-search-root .r-actions{display:flex;gap:16px;align-items:center;margin-top:9px;flex-wrap:wrap;}",
          "#os-search-root .r-jump{font-size:.82rem;color:var(--brand-teal);font-weight:600;}",
          "#os-search-root .r-lesson{font-size:.82rem;color:var(--brand-teal);text-decoration:none;border-bottom:1px solid var(--brand-teal);padding-bottom:1px;}",
          "#os-search-root .r-lesson:hover{background:var(--hit);}",
          "#os-search-root .note{color:var(--muted);font-style:italic;padding:10px 2px;}",
          "#os-search-root .hint{color:var(--muted);padding:14px 2px;font-size:.92rem;}",
          "#os-search-root .hint b{color:var(--ink);}",
          "#os-search-root .err{color:#8a1f1f;padding:12px 14px;border:1px solid #e6c4c4;border-radius:8px;background:#fbf1f1;}",
          /* feedback modal */
          "#os-search-root .fb-overlay{position:fixed;inset:0;background:rgba(20,28,29,.45);display:none;align-items:center;justify-content:center;z-index:9999;padding:16px;}",
          "#os-search-root .fb-overlay.open{display:flex;}",
          "#os-search-root .fb-modal{background:#fff;border-radius:10px;max-width:480px;width:100%;padding:18px 18px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:var(--ink);box-shadow:0 12px 40px rgba(0,0,0,.25);}",
          "#os-search-root .fb-modal h2{font-size:1.02rem;margin:0 0 4px;}",
          "#os-search-root .fb-ctx{color:var(--muted);font-size:.82rem;margin:0 0 12px;line-height:1.4;}",
          "#os-search-root .fb-ctx b{color:var(--ink);}",
          "#os-search-root .fb-modal label{display:block;font-size:.8rem;color:var(--muted);margin:0 0 4px;}",
          "#os-search-root .fb-modal textarea{width:100%;min-height:70px;font:inherit;font-size:.92rem;padding:8px 10px;border:1px solid var(--line);border-radius:8px;resize:vertical;outline:none;}",
          "#os-search-root .fb-modal textarea:focus{border-color:var(--brand-teal);box-shadow:0 0 0 3px rgba(0,100,114,.12);}",
          "#os-search-root .fb-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px;}",
          "#os-search-root .fb-btn{font:inherit;font-size:.86rem;border-radius:8px;padding:8px 14px;cursor:pointer;border:1px solid var(--line);background:#fff;color:var(--ink);}",
          "#os-search-root .fb-btn.primary{background:var(--brand-teal);border-color:var(--brand-teal);color:#fff;}",
          "#os-search-root .fb-btn[disabled]{opacity:.55;cursor:default;}",
          "#os-search-root .fb-status{font-size:.82rem;margin-top:10px;min-height:1.1em;}",
          "#os-search-root .fb-status.ok{color:var(--brand-teal);}",
          "#os-search-root .fb-status.warn{color:#8a1f1f;}"
        ].join("\n");
        document.head.appendChild(st);

        // ---------- DOM ----------
        root.innerHTML =
          '<div class="wrap">' +
            '<h1>Open Studio — search the library</h1>' +
            '<p class="sub">Search every project and Office Hours session by technique, tool, stone, or moment — then jump straight to that second.</p>' +
            '<div class="player-sticky">' +
              '<div class="player-shell">' +
                '<iframe id="os-vimeo" ' +
                  'src="https://player.vimeo.com/video/1076987319?title=0&byline=0&portrait=0&dnt=1" ' +
                  'allow="autoplay; fullscreen; picture-in-picture" ' +
                  'referrerpolicy="strict-origin-when-cross-origin" ' +
                  'title="Open Studio video player"></iframe>' +
              '</div>' +
              '<div class="player-bar">' +
                '<div class="now-playing" id="os-nowPlaying"></div>' +
                '<button type="button" class="im-btn" id="os-indexMoment" title="Suggest this moment be added to the search index">+ Index this moment</button>' +
              '</div>' +
            '</div>' +
            '<div class="search-row">' +
              '<input id="os-q" type="search" placeholder="Try “bezel setting”, “annealing”, “patina”, “riveting”…" ' +
                'autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search the Open Studio library">' +
            '</div>' +
            '<p class="count" id="os-count" aria-live="polite"></p>' +
            '<ul class="results" id="os-results"></ul>' +
            // shared feedback modal
            '<div class="fb-overlay" id="os-fb-overlay" role="dialog" aria-modal="true" aria-labelledby="os-fb-title">' +
              '<div class="fb-modal">' +
                '<h2 id="os-fb-title"></h2>' +
                '<p class="fb-ctx" id="os-fb-ctx"></p>' +
                '<label for="os-fb-note" id="os-fb-note-label"></label>' +
                '<textarea id="os-fb-note" maxlength="600"></textarea>' +
                '<div class="fb-status" id="os-fb-status" aria-live="polite"></div>' +
                '<div class="fb-actions">' +
                  '<button type="button" class="fb-btn" id="os-fb-cancel">Cancel</button>' +
                  '<button type="button" class="fb-btn primary" id="os-fb-send">Send</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>';

        // ---------- engine ----------
        var BUNDLE_URL   = "https://learning.makeryarts.com/bundles/open-studio-community";
        var MAX_RESULTS  = 80;
        var SECTION_MULT = [1.0, 0.85, 0.95]; // [detailed, phase, question]
        var SNIPPET_CAP  = 400;               // defensive cap on any field echoed into a payload

        var resultsEl = document.getElementById("os-results");
        var countEl   = document.getElementById("os-count");
        var qEl        = document.getElementById("os-q");
        var npEl       = document.getElementById("os-nowPlaying");

        var DATA = null;
        var player = null;
        var currentVideo = "1076987319";  // matches the default iframe src
        var currentRec = null;            // last record jumped to (for "Index this moment")
        var lastQuery = "";               // last search query (for "Report this link")

        fetch(CONFIG.DATA_URL, { cache: "no-cache" })
          .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
          .then(function (p) { DATA = reconstruct(p); ready(); })
          .catch(function (e) {
            resultsEl.innerHTML = '<li class="err">Could not load the search index (' +
              esc(String(e.message || e)) + '). If this persists, let Francesca know.</li>';
          });

        function wordSet(s) {
          var set = Object.create(null), parts = s.split(/[^a-z0-9']+/);
          for (var i = 0; i < parts.length; i++) { if (parts[i]) set[parts[i]] = true; }
          return set;
        }

        function reconstruct(p) {
          var P = p.projects, V = p.videos;
          var recs = new Array(p.records.length);
          var vidProject = Object.create(null);   // vid -> first project seen (for Index-this-moment)
          for (var i = 0; i < p.records.length; i++) {
            var row = p.records[i];               // [proj,year,sec,vid,ts,title,snippet]
            var project = P[row[0]], title = row[5], snippet = row[6], vid = V[row[3]];
            var pl = project.toLowerCase(), tl = title.toLowerCase(), sl = snippet.toLowerCase();
            recs[i] = {
              project: project, year: row[1], sec: row[2],
              vid: vid, ts: row[4], title: title, snippet: snippet,
              pl: pl, tl: tl, sl: sl,
              pw: wordSet(pl), tw: wordSet(tl), sw: wordSet(sl)
            };
            if (vidProject[vid] === undefined) vidProject[vid] = project;
          }
          return { recs: recs, terms: p.terms || {}, lessons: p.lessons || {},
                   vidProject: vidProject,
                   sectionLabels: p.section_labels || ["Detailed", "Phase", "Question"] };
        }

        function ready() {
          player = new Vimeo.Player(document.getElementById("os-vimeo"));
          countEl.textContent = DATA.recs.length.toLocaleString() + " moments indexed across the library.";
          showHint();
          qEl.addEventListener("input", debounce(function () { runSearch(qEl.value); }, 110));
          document.getElementById("os-indexMoment").addEventListener("click", onIndexMoment);
          wireFeedbackModal();
          qEl.focus();
        }

        // ---------- term-map query expansion ----------
        function expandToken(t) {
          var set = Object.create(null); set[t] = true;
          var terms = DATA.terms;
          for (var key in terms) {
            var g = terms[key], all = g.forms.concat(key);
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
          lastQuery = q;
          var tokens = tokenize(q);
          if (!tokens.length) { showHint(); return; }

          var phrase = q.toLowerCase();
          var exp = tokens.map(expandToken);

          var hits = [], recs = DATA.recs;
          for (var i = 0; i < recs.length; i++) {
            var r = recs[i], score = 0, qualifies = true;
            for (var ti = 0; ti < tokens.length; ti++) {
              var forms = exp[ti], typed = tokens[ti], best = 0, direct = false;
              for (var fi = 0; fi < forms.length; fi++) {
                var f = forms[fi];
                if (f === typed) {
                  if (r.tl.indexOf(f) !== -1)      { best = Math.max(best, 3.0); direct = true; }
                  else if (r.pl.indexOf(f) !== -1) { best = Math.max(best, 2.5); direct = true; }
                  else if (r.sl.indexOf(f) !== -1) { best = Math.max(best, 1.5); direct = true; }
                } else {
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
            if (b.r.year !== a.r.year) return b.r.year - a.r.year;
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
          countEl.textContent = (total > shown ? "Showing top " + shown + " of " + total
                                               : total + (total === 1 ? " result" : " results"));
          var frag = document.createDocumentFragment();
          for (var i = 0; i < shown; i++) { frag.appendChild(card(hits[i].r, tokens)); }
          resultsEl.appendChild(frag);
        }

        // Hardening: never let data redirect a member off-site.
        function safeLessonUrl(u) {
          var ok = typeof u === "string" &&
            /^https:\/\/learning\.makeryarts\.com\/(courses\/take\/|bundles\/)/.test(u);
          return ok ? u : BUNDLE_URL;
        }

        function card(r, tokens) {
          var li = document.createElement("li");
          li.className = "result";
          li.tabIndex = 0;
          var hasSnip = !!r.snippet;
          var badge = DATA.sectionLabels[r.sec] || "";
          var lessonUrl = safeLessonUrl(DATA.lessons[r.vid]);
          li.innerHTML =
            '<div class="r-top">' +
              '<div class="r-meta">' +
                '<div class="r-project">' + esc(r.project) + ' <span class="yr">· ' + r.year + '</span>' +
                  (badge ? '<span class="r-badge">' + esc(badge) + '</span>' : '') + '</div>' +
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
              '<button type="button" class="r-report">⚑ Report this result</button>' +
            '</div>';
          li.addEventListener("click", function () { jumpTo(r); });
          li.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jumpTo(r); }
          });
          li.querySelector(".r-lesson").addEventListener("click", function (e) { e.stopPropagation(); });
          li.querySelector(".r-report").addEventListener("click", function (e) {
            e.stopPropagation();
            openReport(r);
          });
          return li;
        }

        // ---------- nested player jump (freeze-safe discrete seek) ----------
        function jumpTo(r) {
          currentRec = r;
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

        /* ====================== FEEDBACK FEATURES ====================== */
        // "Index this moment" — reads the exact second from OUR nested player.
        function onIndexMoment() {
          if (!player) { return; }
          player.getCurrentTime().then(function (sec) {
            var seconds = Math.max(0, Math.round(sec || 0));
            var project = currentRec ? currentRec.project
                         : (DATA.vidProject[currentVideo] || "(current video)");
            openFeedback("suggest_index", {
              video_id: String(currentVideo),
              project: project,
              seconds: seconds,
              title: "Index this moment",
              ctxHtml: "Moment: <b>" + esc(project) + "</b> at <b>" + fmt(seconds) + "</b>. " +
                       "Tell us what happens here (technique, tool, stone…) so we can add it to the search index."
            });
          }).catch(function () {
            // If the player can't report a time, still let them describe the moment.
            openFeedback("suggest_index", {
              video_id: String(currentVideo),
              project: (DATA.vidProject[currentVideo] || "(current video)"),
              seconds: 0,
              title: "Index this moment",
              ctxHtml: "Tell us about the moment you'd like added to the search index " +
                       "(we couldn't read the exact time — mention it in your note)."
            });
          });
        }

        // "Report this result" — flags a search hit that lands on the wrong content.
        function openReport(r) {
          openFeedback("report_bad_link", {
            query: lastQuery,
            video_id: String(r.vid),
            project: r.project,
            result_title: r.title,
            seconds: r.ts,
            snippet: r.snippet,
            title: "Report this result",
            ctxHtml: "Result: <b>" + esc(r.title) + "</b> (" + esc(r.project) + ", " + fmt(r.ts) + ").<br>" +
                     "If this jumped to the wrong place, tell us what you expected — optional but helpful."
          });
        }

        // Shared modal plumbing.
        var fbOverlay, fbTitle, fbCtx, fbNote, fbNoteLabel, fbStatus, fbSend, fbCancel, fbPending = null;

        function wireFeedbackModal() {
          fbOverlay   = document.getElementById("os-fb-overlay");
          fbTitle     = document.getElementById("os-fb-title");
          fbCtx       = document.getElementById("os-fb-ctx");
          fbNote      = document.getElementById("os-fb-note");
          fbNoteLabel = document.getElementById("os-fb-note-label");
          fbStatus    = document.getElementById("os-fb-status");
          fbSend      = document.getElementById("os-fb-send");
          fbCancel    = document.getElementById("os-fb-cancel");
          fbCancel.addEventListener("click", closeFeedback);
          fbOverlay.addEventListener("click", function (e) { if (e.target === fbOverlay) closeFeedback(); });
          document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && fbOverlay.classList.contains("open")) closeFeedback();
          });
          fbSend.addEventListener("click", submitFeedback);
        }

        function openFeedback(type, ctx) {
          fbPending = { type: type, ctx: ctx };
          fbTitle.textContent = ctx.title;
          fbCtx.innerHTML = ctx.ctxHtml;
          fbNoteLabel.textContent = (type === "report_bad_link")
            ? "What did you expect to find? (optional)"
            : "Describe the moment / suggested search terms (optional)";
          fbNote.value = "";
          fbStatus.textContent = ""; fbStatus.className = "fb-status";
          fbSend.disabled = false; fbSend.textContent = "Send";
          fbOverlay.classList.add("open");
          fbNote.focus();
        }

        function closeFeedback() {
          fbOverlay.classList.remove("open");
          fbPending = null;
        }

        function thinkificUser() {
          try {
            var u = (window.Thinkific && window.Thinkific.current_user) || {};
            return { email: u.email || "", name: u.name || u.full_name || "" };
          } catch (e) { return { email: "", name: "" }; }
        }

        function buildPayload() {
          var c = fbPending.ctx, type = fbPending.type, u = thinkificUser();
          var note = (fbNote.value || "").slice(0, SNIPPET_CAP);
          var base = {
            type: type,
            submitted_at: new Date().toISOString(),
            student_email: u.email,     // metadata only — never used as a gate
            student_name: u.name,
            token: CONFIG.FEEDBACK_TOKEN,
            note: note,
            page: location.pathname
          };
          if (type === "report_bad_link") {
            base.query        = (c.query || "").slice(0, SNIPPET_CAP);
            base.video_id     = c.video_id;
            base.project      = c.project;
            base.result_title = c.result_title;
            base.seconds      = c.seconds;
            base.snippet      = (c.snippet || "").slice(0, SNIPPET_CAP);
          } else { // suggest_index
            base.video_id = c.video_id;
            base.project  = c.project;
            base.seconds  = c.seconds;
          }
          return base;
        }

        function submitFeedback() {
          if (!fbPending) return;
          fbSend.disabled = true; fbSend.textContent = "Sending…";
          fbStatus.textContent = ""; fbStatus.className = "fb-status";
          var payload = buildPayload();

          var doneOk = function (msg) {
            fbStatus.textContent = msg; fbStatus.className = "fb-status ok";
            fbSend.textContent = "Sent";
            setTimeout(closeFeedback, 1400);
          };

          var url = CONFIG.FEEDBACK_WEBHOOK_URL;
          if (url) {
            // text/plain keeps this a CORS-simple request (no preflight); the
            // Make webhook parses the JSON body regardless of content-type.
            fetch(url, {
              method: "POST",
              headers: { "Content-Type": "text/plain;charset=UTF-8" },
              body: JSON.stringify(payload)
            }).then(function (res) {
              if (res && res.ok) { doneOk("Thanks — got it. We'll take a look."); }
              else { mailtoFallback(payload, "We couldn't reach the form, so your email app is opening with the details — just hit send."); }
            }).catch(function () {
              mailtoFallback(payload, "We couldn't reach the form, so your email app is opening with the details — just hit send.");
            });
          } else {
            mailtoFallback(payload, "Your email app is opening with the details — just hit send and we'll take it from there.");
          }
        }

        function mailtoFallback(payload, msg) {
          var subj = (payload.type === "report_bad_link")
            ? "Open Studio search — report a result"
            : "Open Studio search — index a moment";
          var lines = [];
          for (var k in payload) {
            if (payload[k] === "" || payload[k] === undefined || payload[k] === null) continue;
            if (k === "token") continue; // don't leak the shared token into a plain email
            lines.push(k + ": " + payload[k]);
          }
          var href = "mailto:" + encodeURIComponent(CONFIG.FEEDBACK_MAILTO) +
                     "?subject=" + encodeURIComponent(subj) +
                     "&body=" + encodeURIComponent(lines.join("\n"));
          // Opening the compose window counts as a confirmed handoff.
          var w = window.open(href, "_blank");
          if (!w) { location.href = href; }
          fbStatus.textContent = msg; fbStatus.className = "fb-status ok";
          fbSend.textContent = "Opened email";
          setTimeout(closeFeedback, 2200);
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
        function hi(text, tokens) {
          var safe = esc(text);
          if (!tokens || !tokens.length) return safe;
          var uniq = tokens.filter(function (t, i) { return tokens.indexOf(t) === i && t.length >= 2; })
                           .sort(function (a, b) { return b.length - a.length; })
                           .map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
          if (!uniq.length) return safe;
          try { return safe.replace(new RegExp("(" + uniq.join("|") + ")", "gi"), "<mark>$1</mark>"); }
          catch (e) { return safe; }
        }
        function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

      } catch (e) { if (window.console) console.error("[os-search] app", e); }
    }

  } catch (e) { if (window.console) console.error("[os-search] app", e); }
})();
