/* RAN Validation Trainer: app logic. No build step, no dependencies. Progress is kept in this browser (localStorage). */
(function(){
"use strict";
const LS_KEY = "ran-validation-v1";
const $ = (s, r) => (r || document).querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pct = x => Math.round(Math.min(1, Math.max(0, x)) * 100);
const dayNum = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };
const INTERVALS = [1, 2, 4, 8, 16, 32, 64, 120];   /* days until a card comes back, by box */

/* ---------- review deck: built from the journey, the fact list and the terms ---------- */
const CARDS = [];
JOURNEY.forEach(ch => ch.steps.forEach((s, i) => CARDS.push({id: "jq-" + ch.id + "-" + i, f: s.q, b: s.a, g: ch.t, ch: ch.id, pr: 0})));
FACTS.forEach(f => CARDS.push({id: "f-" + slug(f[0]).slice(0, 48), f: f[0], b: f[1], g: f[2], pr: 1}));
TERMS.forEach(t => CARDS.push({id: "t-" + slug(t[0]), f: t[0], b: t[2], g: TERM_CATS[t[1]], term: true, pr: 2}));
const CARD_BY_ID = {}; CARDS.forEach(c => { CARD_BY_ID[c.id] = c; });
const allLessons = LEARN.flatMap(m => m.lessons);

/* ---------- state ---------- */
function blank(){ return {v: 1, j: {}, c: {}, r: {}, day: {d: 0, nw: 0, done: 0}, streak: {last: 0, n: 0}, set: {newPerDay: 10}, lessons: {}, updated: 0}; }
function normalize(s){ const b = blank(); if (s && typeof s === "object") for (const k in b) if (s[k] !== undefined && s[k] !== null && typeof s[k] === typeof b[k]) b[k] = s[k]; return b; }
let state = blank();
try { const raw = localStorage.getItem(LS_KEY); if (raw) state = normalize(JSON.parse(raw)); } catch (e) {}
function save(){ state.updated = Date.now(); try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { toast("Could not save on this device"); } renderChrome(); }
function rollDay(){ const t = dayNum(); if (state.day.d !== t) state.day = {d: t, nw: 0, done: 0}; }
function markActive(){ const t = dayNum(), s = state.streak; if (s.last === t) return; s.n = s.last === t - 1 ? s.n + 1 : 1; s.last = t; }
const jLevel = id => (state.j[id] || {}).lv || 0;

/* ---------- small pieces ---------- */
function bars(n, of){ of = of || 3; let h = '<span class="bars' + (of === 5 ? " five" : "") + '" aria-hidden="true">'; for (let i = 0; i < of; i++) h += "<b" + (i < n ? ' class="on"' : "") + "></b>"; return h + "</span>"; }
const bars5 = x => bars(x <= 0 ? 0 : Math.max(1, Math.round(x * 5)), 5);
const tick = on => '<span class="tick' + (on ? " on" : "") + '" aria-hidden="true">&#10003;</span>';
let toastTimer = null;
function toast(msg){ let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); } t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600); }
const ICONS = {
  today: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>',
  journey: '<svg viewBox="0 0 24 24"><circle cx="6" cy="5" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="19" r="2"/><path d="M8 5h6a4 4 0 0 1 4 4v1M16 12h-6a4 4 0 0 0-4 4v1"/></svg>',
  cases: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M9 11h4M11 9v4"/></svg>',
  review: '<svg viewBox="0 0 24 24"><rect x="4" y="6" width="13" height="14" rx="2"/><path d="M8 3h10a2 2 0 0 1 2 2v12"/></svg>',
  library: '<svg viewBox="0 0 24 24"><path d="M5 4h4v16H5zM11 4h4v16h-4zM17 6l3 .8-3 13-3-.8z"/></svg>'
};
const TABS = [["today","Today"],["journey","Journey"],["cases","Cases"],["review","Review"],["library","Library"]];

/* ---------- review scheduling ---------- */
function dueCards(){ const t = dayNum(); return CARDS.filter(c => state.r[c.id] && state.r[c.id].due <= t); }
function newCards(){
  rollDay();
  const left = Math.max(0, state.set.newPerDay - state.day.nw);
  if (!left) return [];
  const pool = CARDS.filter(c => !state.r[c.id]).map((c, i) => ({c, i, p: c.pr === 0 ? (jLevel(c.ch) >= 1 ? 0 : 3) : c.pr}));
  pool.sort((a, b) => a.p - b.p || a.i - b.i);
  return pool.slice(0, left).map(x => x.c);
}
function grade(card, g, again){
  rollDay();
  const t = dayNum(), prev = state.r[card.id], isNew = !prev;
  if (g === 0) state.r[card.id] = {b: 0, due: t + 1, n: ((prev || {}).n || 0) + 1};
  else if (!again) { const b = Math.min(INTERVALS.length - 1, (prev ? prev.b : 0) + g); state.r[card.id] = {b, due: t + INTERVALS[b], n: ((prev || {}).n || 0) + 1}; }
  if (isNew) state.day.nw++;
  state.day.done++;
  markActive(); save();
}
function reviewStats(){ let learned = 0, strong = 0; CARDS.forEach(c => { const r = state.r[c.id]; if (r) { learned++; if (r.b >= 4) strong++; } }); return {learned, strong, total: CARDS.length}; }

/* ---------- message ladder ---------- */
function ladder(ch, opt){
  opt = opt || {};
  const upto = opt.upto === undefined ? ch.steps.length : opt.upto, hidden = opt.hidden || new Set(), now = opt.now;
  const n = ch.lanes.length, W = n === 2 ? 430 : n === 3 ? 620 : 720, mx = n === 2 ? 80 : n === 3 ? 80 : 70, top = 34, rh = 50, maxLen = n === 2 ? 50 : n === 3 ? 52 : 44;
  const minW = n === 2 ? 330 : n === 3 ? 500 : 600;
  const x = i => mx + i * (W - 2 * mx) / (n - 1);
  const rows = Math.max(1, upto), H = top + rows * rh + 12;
  let s = '<svg style="min-width:' + minW + 'px" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Message sequence: ' + esc(ch.t) + '">';
  ch.lanes.forEach((l, i) => { s += '<text class="lane" x="' + x(i) + '" y="16" text-anchor="middle">' + esc(l) + '</text><line class="v" x1="' + x(i) + '" y1="24" x2="' + x(i) + '" y2="' + (H - 6) + '"/>'; });
  for (let k = 0; k < upto; k++) {
    const st = ch.steps[k], y = top + k * rh + 34, hid = hidden.has(k);
    let label = hid ? "?  gap " + (k + 1) : st.m; if (label.length > maxLen) label = label.slice(0, maxLen - 1) + "…";
    const tw = label.length * 6.7, cls = hid ? "gap" : (now === k ? "now" : "self");
    if (st.f === st.t || hid) {
      const base = hid ? (x(st.f) + x(st.t)) / 2 : x(st.f);
      const cx = Math.min(Math.max(base, tw / 2 + 28), W - tw / 2 - 12);
      s += '<rect class="' + cls + '" x="' + (cx - tw / 2 - 10) + '" y="' + (y - 21) + '" width="' + (tw + 20) + '" height="24" rx="4"/><text' + (hid ? ' class="q"' : "") + ' x="' + cx + '" y="' + (y - 5) + '" text-anchor="middle">' + esc(label) + "</text>";
      s += '<circle cx="' + (cx - tw / 2 - 10) + '" cy="' + (y - 9) + '" r="9"/><text class="num" x="' + (cx - tw / 2 - 10) + '" y="' + (y - 5.5) + '" text-anchor="middle">' + (k + 1) + "</text>";
    } else {
      const x1 = x(st.f), x2 = x(st.t), dir = x2 > x1 ? 1 : -1;
      const cx = Math.min(Math.max((x1 + x2) / 2, tw / 2 + 8), W - tw / 2 - 8);
      if (now === k) s += '<rect class="now" x="' + (cx - tw / 2 - 6) + '" y="' + (y - 27) + '" width="' + (tw + 12) + '" height="18" rx="4"/>';
      s += '<text x="' + cx + '" y="' + (y - 14) + '" text-anchor="middle">' + esc(label) + "</text>";
      s += '<line class="a" x1="' + x1 + '" y1="' + y + '" x2="' + (x2 - dir * 7) + '" y2="' + y + '"/><polygon points="' + x2 + "," + y + " " + (x2 - dir * 9) + "," + (y - 4.5) + " " + (x2 - dir * 9) + "," + (y + 4.5) + '"/>';
      s += '<circle cx="' + x1 + '" cy="' + y + '" r="9"/><text class="num" x="' + x1 + '" y="' + (y + 3.5) + '" text-anchor="middle">' + (k + 1) + "</text>";
    }
  }
  return '<div class="ladder">' + s + "</svg></div>";
}
const dirText = (ch, st) => st.f === st.t ? esc(ch.lanes[st.f]) : esc(ch.lanes[st.f]) + " &rarr; " + esc(ch.lanes[st.t]);
function stepCard(ch, k, showWhy){
  const st = ch.steps[k];
  return '<div class="card step"><div class="row"><span class="pill a">' + esc(st.l) + '</span><span class="dir">Step ' + (k + 1) + " of " + ch.steps.length + " &middot; " + dirText(ch, st) + '</span></div><div class="m">' + esc(st.m) + "</div><p>" + esc(st.d) + '</p><pre class="log wrapline" aria-label="Simplified log line">' + esc(st.log) + "</pre>" +
    (showWhy ? '<div class="note"><span class="k">' + esc(st.q) + "</span>" + esc(st.a) + "</div>" : "") + "</div>";
}

/* ---------- routing ---------- */
const ui = {route: ["today"], j: null, c: null, rv: null, lib: {mod: LEARN[0].id, termQ: "", open: new Set()}, shown: new Set(), timer: null};
function parseHash(){ const h = (location.hash || "").replace(/^#\/?/, ""); const parts = h.split("/").filter(Boolean); return TABS.some(t => t[0] === parts[0]) ? parts : ["today"]; }
function go(){ ui.route = parseHash(); render(); window.scrollTo(0, 0); }
function renderChrome(){
  const due = dueCards().length;
  $("#nav").innerHTML = TABS.map(t => '<a href="#' + t[0] + '"' + (t[0] === ui.route[0] ? ' aria-current="page"' : "") + ">" + ICONS[t[0]] + (t[0] === "review" && due ? '<span class="dot" aria-label="' + due + ' due">' + (due > 99 ? "99+" : due) + "</span>" : "") + "<span>" + t[1] + "</span></a>").join("");
  const s = state.streak, alive = s.last >= dayNum() - 1;
  $("#streak").innerHTML = alive && s.n ? "<b>" + s.n + "</b> day" + (s.n === 1 ? "" : "s") + " in a row" : "";
}
function render(){
  renderChrome();
  const r = ui.route;
  let h;
  if (r[0] === "journey") h = r[1] && JOURNEY.some(c => c.id === r[1]) ? viewChapter(r[1]) : viewJourney();
  else if (r[0] === "cases") h = r[1] && CASES.some(c => c.id === r[1]) ? viewCase(r[1]) : viewCases();
  else if (r[0] === "review") h = viewReview();
  else if (r[0] === "library") h = viewLibrary(r[1]);
  else h = viewToday();
  $("#view").innerHTML = h;
}
function rerender(){ const y = window.scrollY; render(); window.scrollTo(0, y); }

/* ---------- Today ---------- */
function nextChapter(){ for (let lv = 0; lv < 3; lv++) { const c = JOURNEY.find(ch => jLevel(ch.id) === lv); if (c) return {ch: c, lv}; } return null; }
function nextCase(){ return CASES.find(c => !state.c[c.id]) || CASES.slice().sort((a, b) => state.c[a.id].best - state.c[b.id].best)[0]; }
const PASS_NAMES = ["Guided walk", "Fill the gaps", "Rebuild from memory"];
function viewToday(){
  rollDay();
  const due = dueCards().length, nw = newCards().length, nc = nextChapter(), cs = nextCase(), rs = reviewStats();
  const jl = JOURNEY.reduce((a, c) => a + jLevel(c.id), 0) / (JOURNEY.length * 3);
  const cl = CASES.reduce((a, c) => a + ((state.c[c.id] || {}).best || 0), 0) / CASES.length;
  let h = '<div class="stack"><h2>Today</h2><p class="lede">Three short blocks. Review first, while yesterday is still fresh. Then one step forward on the journey. Then one case.</p></div>';
  h += '<div class="stack">';
  h += '<a class="card todo" href="#review"><span class="n">' + (due + nw) + '</span><span class="grow"><span class="t">Review</span><br><span class="s">' + (due + nw ? due + " due, " + nw + " new. About " + Math.max(1, Math.round((due + nw) * 0.35)) + " min." : "Nothing due right now. " + state.day.done + " done today.") + '</span></span><span class="go">' + (due + nw ? "Start" : "Open") + "</span></a>";
  if (nc) h += '<a class="card todo" href="#journey/' + nc.ch.id + '"><span class="n">' + (JOURNEY.indexOf(nc.ch) + 1) + '</span><span class="grow"><span class="t">Journey: ' + esc(nc.ch.t) + '</span><br><span class="s">Next pass: ' + PASS_NAMES[nc.lv] + '</span></span><span class="go">Open</span></a>';
  else h += '<a class="card todo" href="#journey"><span class="n">' + JOURNEY.length + '</span><span class="grow"><span class="t">Journey complete</span><br><span class="s">Rebuild any chapter again to keep it sharp.</span></span><span class="go">Open</span></a>';
  h += '<a class="card todo" href="#cases/' + cs.id + '"><span class="n">' + (CASES.indexOf(cs) + 1) + '</span><span class="grow"><span class="t">Case: ' + esc(cs.t) + '</span><br><span class="s">' + (state.c[cs.id] ? "Best so far " + pct(state.c[cs.id].best) + "%. Try to beat it." : "Not solved yet. About 5 min.") + '</span></span><span class="go">Open</span></a>';
  h += "</div>";
  h += '<div class="stats"><div class="stat"><span class="eyebrow">Journey</span><span class="n">' + pct(jl) + '%</span><div class="meter"><span style="width:' + pct(jl) + '%"></span></div><span class="l">' + JOURNEY.filter(c => jLevel(c.id) === 3).length + " of " + JOURNEY.length + ' chapters rebuilt</span></div>' +
    '<div class="stat"><span class="eyebrow">Cases</span><span class="n">' + pct(cl) + '%</span><div class="meter"><span style="width:' + pct(cl) + '%"></span></div><span class="l">' + Object.keys(state.c).length + " of " + CASES.length + ' worked</span></div>' +
    '<div class="stat"><span class="eyebrow">Memory</span><span class="n">' + rs.learned + '</span><div class="meter"><span style="width:' + pct(rs.strong / rs.total) + '%"></span></div><span class="l">cards started, ' + rs.strong + " holding 2+ weeks</span></div></div>";
  /* focus timer */
  const tm = ui.timer;
  h += '<div class="card stack"><div class="row"><div class="grow"><h3>Focus timer</h3><p class="lede">One block, one task, phone notifications off.</p></div><span class="timer" id="timer">' + (tm ? fmtTime(tm.left) : "25:00") + '</span></div><div class="row">' +
    (tm ? '<button class="btn" data-act="timer-stop">Stop</button>' : '<button class="btn pri" data-act="timer-start" data-v="25">Start 25 min</button><button class="btn" data-act="timer-start" data-v="10">10 min</button>') + "</div></div>";
  /* settings */
  h += '<details class="item" data-id="settings"' + (ui.lib.open.has("settings") ? " open" : "") + '><summary><span class="ttl">Settings and backup<span class="sub">New cards per day, install, export, reset</span></span></summary><div class="body">' +
    '<div class="row"><label for="newPerDay" class="grow">New review cards per day</label><select class="field" id="newPerDay" data-ch="newPerDay">' + [5, 10, 15, 20, 30].map(n => '<option value="' + n + '"' + (state.set.newPerDay === n ? " selected" : "") + ">" + n + "</option>").join("") + "</select></div>" +
    '<div class="note"><span class="k">Install as an app</span>iPhone or iPad: open this page in Safari, tap Share, then "Add to Home Screen". Android or desktop Chrome: use "Install app" in the browser menu' + (ui.installEvt ? ', or the button below.' : ".") + " After the first visit it also opens without a connection.</div>" +
    (ui.installEvt ? '<div><button class="btn pri" data-act="install">Install app</button></div>' : "") +
    '<div class="note warn"><span class="k">Where your progress lives</span>Only in this browser on this device. It does not sync. Export a backup now and then, and import it on another device to continue there.</div>' +
    '<div class="row"><button class="btn" data-act="export">Export backup</button><label class="btn" for="importFile">Import backup</label><input type="file" id="importFile" accept="application/json,.json" hidden></div>' +
    '<div class="row">' + (ui.shown.has("reset") ? '<button class="btn bad" data-act="reset-yes">Yes, clear everything</button><button class="btn" data-act="reset-no">Keep my progress</button>' : '<button class="btn sm" data-act="reset-ask">Clear my progress</button>') + "</div>" +
    "</div></details>";
  h += '<p class="lede" style="font-size:.85rem">Log lines in this app are simplified for teaching. They are not output from a real tool. Check timer values and spec details against 3GPP before you rely on them.</p>';
  return h;
}
const fmtTime = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
function startTimer(min){
  stopTimer();
  ui.timer = {end: Date.now() + min * 60000, left: min * 60};
  ui.timer.h = setInterval(() => {
    const left = Math.max(0, Math.round((ui.timer.end - Date.now()) / 1000)); ui.timer.left = left;
    const el = $("#timer"); if (el) el.textContent = fmtTime(left);
    if (left <= 0) { stopTimer(); toast("Block finished. Take a 5 minute break."); if (ui.route[0] === "today") rerender(); }
  }, 1000);
}
function stopTimer(){ if (ui.timer) clearInterval(ui.timer.h); ui.timer = null; }

/* ---------- Journey ---------- */
function viewJourney(){
  let h = '<div class="stack"><h2>One connection, end to end</h2><p class="lede">Follow one phone from power-on to data, handover and failure. Each chapter has three passes. In the first you predict each step. In the second you fill gaps. In the third you rebuild the whole flow from memory.</p></div>';
  h += '<ol class="map">' + JOURNEY.map((ch, i) => { const lv = jLevel(ch.id); return '<li><div class="rail"><span class="node' + (lv >= 3 ? " l3" : lv >= 1 ? " l1" : "") + '">' + (i + 1) + '</span><span class="line"></span></div><a href="#journey/' + ch.id + '"><span class="grow"><span class="ttl">' + esc(ch.t) + '</span><br><span class="sub">' + (lv ? PASS_NAMES[lv - 1] + " done" : ch.steps.length + " steps") + "</span></span>" + bars(lv) + "</a></li>"; }).join("") + "</ol>";
  return h;
}
function viewChapter(id){
  const ch = JOURNEY.find(c => c.id === id), lv = jLevel(id), idx = JOURNEY.indexOf(ch);
  if (ui.j && ui.j.id !== id) ui.j = null;
  if (ui.j) return ui.j.mode === 1 ? viewPass1(ch) : ui.j.mode === 2 ? viewPass2(ch) : viewPass3(ch);
  let h = '<a class="back" href="#journey">&larr; All chapters</a><div class="stack"><span class="eyebrow">Chapter ' + (idx + 1) + " of " + JOURNEY.length + '</span><h2>' + esc(ch.t) + '</h2><p class="lede">' + esc(ch.s) + "</p></div>";
  h += '<div class="stack">' + [1, 2, 3].map(m => { const done = lv >= m, next = lv === m - 1; return '<button class="card todo" style="text-align:left;width:100%" data-act="pass" data-v="' + m + '">' + tick(done) + '<span class="grow"><span class="t">Pass ' + m + ": " + PASS_NAMES[m - 1] + '</span><br><span class="s">' + ["Predict each step before you see it, then read why.", "The flow with half the steps missing. Put them back.", "All steps shuffled. Tap them in the right order, then explain three of them."][m - 1] + '</span></span><span class="go">' + (done ? "Again" : next ? "Start" : "Open") + "</span></button>"; }).join("") + "</div>";
  if (lv >= 1) {
    h += '<details class="item" data-id="study-' + id + '"' + (ui.lib.open.has("study-" + id) ? " open" : "") + '><summary><span class="ttl">Study view<span class="sub">The whole flow with every explanation</span></span></summary><div class="body">' + ladder(ch) + ch.steps.map((s, k) => stepCard(ch, k, true)).join("") + "</div></details>";
  } else h += '<div class="note"><span class="k">Why the flow is hidden</span>Trying to predict a step before you see it makes it stick better than reading it first. The full study view opens after pass 1.</div>';
  const nx = JOURNEY[idx + 1];
  if (nx && lv >= 1) h += '<a class="btn" href="#journey/' + nx.id + '">Next chapter: ' + esc(nx.t) + "</a>";
  return h;
}
function startPass(ch, m){
  if (m === 1) { ui.j = {id: ch.id, mode: 1, i: 0, right: 0, pick: null, opts: null, why: false}; p1Options(ch); }
  else if (m === 2) { const hid = shuffle(ch.steps.map((_, i) => i)).slice(0, Math.ceil(ch.steps.length / 2)).sort((a, b) => a - b); ui.j = {id: ch.id, mode: 2, hidden: new Set(hid), order: hid.slice(), at: 0, right: 0, total: hid.length, pick: null, wrongFirst: false, opts: shuffle(hid)}; }
  else ui.j = {id: ch.id, mode: 3, placed: 0, mistakes: 0, opts: shuffle(ch.steps.map((_, i) => i)), flash: null, stage: "order", ex: shuffle(ch.steps.map((_, i) => i)).slice(0, 3), exAt: 0, exShown: false, exGot: 0};
}
function p1Options(ch){
  const j = ui.j, correct = ch.steps[j.i].m;
  let pool = ch.steps.map(s => s.m).filter(m => m !== correct);
  const later = ch.steps.slice(j.i + 1).map(s => s.m);
  let picks = shuffle(later).slice(0, 2);
  picks = picks.concat(shuffle(pool.filter(m => !picks.includes(m))).slice(0, 3 - picks.length));
  j.opts = shuffle([correct].concat(picks)); j.pick = null; j.why = false;
}
function viewPass1(ch){
  const j = ui.j;
  if (j.finished) return passDone(ch, 1, true, "You predicted " + j.right + " of " + ch.steps.length + " steps before seeing them.", "");
  const st = ch.steps[j.i], answered = j.pick !== null;
  let h = '<button class="back btn sm" data-act="pass-quit">&larr; Leave this pass</button><div class="stack"><span class="eyebrow">' + esc(ch.t) + " &middot; pass 1</span><h2>" + (answered ? "Step " + (j.i + 1) : "What happens next?") + '</h2></div><div class="meter"><span style="width:' + pct(j.i / ch.steps.length) + '%"></span></div>';
  h += ladder(ch, {upto: answered ? j.i + 1 : j.i, now: answered ? j.i : undefined});
  if (!answered) {
    h += '<p class="lede">' + (j.i === 0 ? "This is the first step of the chapter. Which one is it?" : "You have seen " + j.i + " step" + (j.i === 1 ? "" : "s") + ". Say your guess out loud, then pick.") + '</p><div class="opts">' + j.opts.map((o, k) => '<button class="opt mono" data-act="p1-pick" data-v="' + k + '">' + esc(o) + "</button>").join("") + "</div>";
  } else {
    const ok = j.opts[j.pick] === st.m;
    h += '<div class="note ' + (ok ? "good" : "bad") + '"><span class="k">' + (ok ? "You predicted it" : "Not this time") + "</span>" + (ok ? "Good. Now read why it happens." : "You picked: " + esc(j.opts[j.pick]) + ". The next step is below. A wrong guess still helps you remember the right one.") + "</div>";
    h += stepCard(ch, j.i, false);
    h += '<div class="card stack"><span class="eyebrow">Explain it to yourself</span><p style="font-weight:600">' + esc(st.q) + "</p>" + (j.why ? '<p>' + esc(st.a) + "</p>" : '<div><button class="btn" data-act="p1-why">I have my answer. Show it</button></div>') + "</div>";
    h += '<div><button class="btn pri" data-act="p1-next"' + (j.why ? "" : " disabled") + ">" + (j.i + 1 < ch.steps.length ? "Next step" : "Finish pass 1") + "</button></div>";
  }
  return h;
}
function viewPass2(ch){
  const j = ui.j;
  if (j.at >= j.total) return passDone(ch, 2, j.right / j.total >= 0.8, "You placed " + j.right + " of " + j.total + " gaps on the first try.", "Pass 2 counts at 80% or more on the first try.");
  const gap = j.order[j.at], answered = j.pick !== null;
  const still = new Set(j.order.slice(answered && j.pickOk ? j.at + 1 : j.at));
  let h = '<button class="back btn sm" data-act="pass-quit">&larr; Leave this pass</button><div class="stack"><span class="eyebrow">' + esc(ch.t) + " &middot; pass 2</span><h2>Which step fills gap " + (gap + 1) + '?</h2></div><div class="meter"><span style="width:' + pct(j.at / j.total) + '%"></span></div>';
  h += ladder(ch, {hidden: still});
  h += '<div class="opts">' + j.opts.map(k => { const used = !still.has(k) && !(answered && k === gap); let c = ""; if (answered && k === gap && j.pickOk) c = " right"; else if (j.wrong && j.wrong.has(k)) c = " wrong"; return '<button class="opt mono' + c + (used ? " used" : "") + '" data-act="p2-pick" data-v="' + k + '"' + (used || (answered && j.pickOk) ? " disabled" : "") + ">" + esc(ch.steps[k].m) + "</button>"; }).join("") + "</div>";
  if (answered && j.pickOk) h += '<div class="note good"><span class="k">Step ' + (gap + 1) + "</span>" + esc(ch.steps[gap].d) + '</div><div><button class="btn pri" data-act="p2-next">' + (j.at + 1 < j.total ? "Next gap" : "Finish pass 2") + "</button></div>";
  else if (j.wrong && j.wrong.size) h += '<div class="note bad"><span class="k">Not that one</span>Look at what comes just before and just after the gap, and who is talking to whom.</div>';
  return h;
}
function viewPass3(ch){
  const j = ui.j;
  if (j.stage === "done") return passDone(ch, 3, j.mistakes <= 2, "You rebuilt " + ch.steps.length + " steps with " + j.mistakes + " wrong tap" + (j.mistakes === 1 ? "" : "s") + ", and explained " + j.exGot + " of " + j.ex.length + ".", "Pass 3 counts with 2 wrong taps or fewer.");
  let h = '<button class="back btn sm" data-act="pass-quit">&larr; Leave this pass</button>';
  if (j.stage === "order") {
    h += '<div class="stack"><span class="eyebrow">' + esc(ch.t) + " &middot; pass 3</span><h2>Rebuild the flow</h2><p class=\"lede\">Tap the steps in the order they happen. " + j.placed + " of " + ch.steps.length + " placed, " + j.mistakes + " wrong.</p></div>" + '<div class="meter"><span style="width:' + pct(j.placed / ch.steps.length) + '%"></span></div>';
    if (j.placed) h += '<div class="card"><ol class="built">' + ch.steps.slice(0, j.placed).map(s => "<li>" + esc(s.m) + "</li>").join("") + "</ol></div>";
    h += '<div class="opts">' + j.opts.map(k => k < j.placed ? "" : '<button class="opt mono' + (j.flash === k ? " wrong" : "") + '" data-act="p3-pick" data-v="' + k + '">' + esc(ch.steps[k].m) + "</button>").join("") + "</div>";
  } else {
    const k = j.ex[j.exAt], st = ch.steps[k];
    h += '<div class="stack"><span class="eyebrow">' + esc(ch.t) + " &middot; explain " + (j.exAt + 1) + " of " + j.ex.length + "</span><h2>Say the answer out loud</h2></div>";
    h += '<div class="card flash"><span class="pill n">Step ' + (k + 1) + ": " + esc(st.m.length > 40 ? st.m.slice(0, 39) + "…" : st.m) + '</span><div class="front">' + esc(st.q) + "</div>" + (j.exShown ? '<div class="back">' + esc(st.a) + '</div><div class="row"><button class="btn bad" data-act="p3-ex" data-v="0">I missed it</button><button class="btn good" data-act="p3-ex" data-v="1">I had it</button></div>' : '<div><button class="btn pri" data-act="p3-show">Show answer</button></div>') + "</div>";
  }
  return h;
}
function passDone(ch, m, passed, line, rule){
  const idx = JOURNEY.indexOf(ch), nx = JOURNEY[idx + 1];
  let h = '<div class="stack"><span class="eyebrow">' + esc(ch.t) + " &middot; pass " + m + "</span><h2>" + (passed ? "Pass " + m + " done" : "Not yet") + '</h2><p class="lede">' + line + " " + (passed ? "" : rule) + "</p></div>";
  h += '<div class="note ' + (passed ? "good" : "warn") + '"><span class="k">' + (passed ? "What happens now" : "What to do") + "</span>" + (passed ? (m === 1 ? "The why-questions from this chapter are now first in line for your daily review." : m === 2 ? "Leave a gap before pass 3. Tomorrow is better than right now." : "This chapter is rebuilt. Review will bring its questions back at longer and longer gaps.") : "Open the study view, read the steps you missed, and try again later today or tomorrow.") + "</div>";
  h += '<div class="row"><button class="btn" data-act="pass" data-v="' + m + '">Do this pass again</button><button class="btn pri" data-act="pass-quit">Back to the chapter</button>' + (nx && passed ? '<a class="btn" href="#journey/' + nx.id + '" data-act="pass-clear">Next chapter</a>' : "") + "</div>";
  return h;
}
function finishPass(ch, m, passed){ const s = state.j[ch.id] || (state.j[ch.id] = {lv: 0}); if (passed && s.lv < m) s.lv = m; markActive(); save(); }

/* ---------- Cases ---------- */
function viewCases(){
  let h = '<div class="stack"><h2>Case files</h2><p class="lede">Twelve failures to work through. Read the log, choose what to check next, name the root cause, and write the bug title. The logs are simplified teaching logs, not output from a real tool.</p></div><div class="stack">';
  CASES.forEach((c, i) => { const s = state.c[c.id]; h += '<a class="card todo" href="#cases/' + c.id + '"><span class="n">' + (i + 1) + '</span><span class="grow"><span class="t">' + esc(c.t) + '</span><br><span class="s">' + esc(c.tag) + (s ? " &middot; best " + pct(s.best) + "%" : "") + "</span></span>" + (s ? '<span class="pill ' + (s.best >= 0.85 ? "g" : s.best >= 0.6 ? "w" : "b") + '">' + pct(s.best) + "%</span>" : '<span class="pill n">New</span>') + "</a>"; });
  return h + "</div>";
}
function startCase(c){ ui.c = {id: c.id, i: 0, score: 0, pick: null, order: c.nodes.map(n => shuffle(n.o.map((_, k) => k))), causeOrder: shuffle(c.cause.o.map((_, k) => k)), stage: "nodes", causePick: null, bugShown: false, saved: false}; }
function viewCase(id){
  const c = CASES.find(x => x.id === id);
  if (!ui.c || ui.c.id !== id) startCase(c);
  const u = ui.c, max = c.nodes.length * 2 + 2;
  let h = '<a class="back" href="#cases">&larr; All cases</a><div class="stack"><span class="eyebrow">Case ' + (CASES.indexOf(c) + 1) + " &middot; " + esc(c.tag) + "</span><h2>" + esc(c.t) + "</h2><p>" + esc(c.brief) + '</p><p class="lede">Setup: ' + esc(c.setup) + "</p></div>";
  h += '<div class="stack" style="gap:6px"><span class="eyebrow">Log extract (simplified)</span><pre class="log">' + c.log.map(esc).join("\n") + "</pre></div>";
  const stepsTotal = c.nodes.length + 1, at = u.stage === "nodes" ? u.i : u.stage === "cause" ? c.nodes.length : stepsTotal;
  h += '<div class="meter"><span style="width:' + pct(at / stepsTotal) + '%"></span></div>';
  if (u.stage === "nodes") {
    const n = c.nodes[u.i], answered = u.pick !== null;
    h += '<div class="card stack"><span class="eyebrow">Decision ' + (u.i + 1) + " of " + c.nodes.length + "</span><h3>" + esc(n.q) + '</h3><div class="opts">' + u.order[u.i].map(k => { const o = n.o[k]; let cl = ""; if (answered) { if (o[1] === 2) cl = " right"; else if (k === u.pick) cl = o[1] === 1 ? " ok" : " wrong"; } return '<button class="opt' + cl + '" data-act="case-pick" data-v="' + k + '"' + (answered ? " disabled" : "") + ">" + esc(o[0]) + "</button>"; }).join("") + "</div>";
    if (answered) { const o = n.o[u.pick]; h += '<div class="note ' + (o[1] === 2 ? "good" : o[1] === 1 ? "warn" : "bad") + '"><span class="k">' + (o[1] === 2 ? "Best next move" : o[1] === 1 ? "Reasonable, but slower" : "Wrong turn") + "</span>" + esc(o[2]) + (o[1] === 2 ? "" : " Best move: " + esc(n.o.find(x => x[1] === 2)[0]) + ".") + '</div><div><button class="btn pri" data-act="case-next">Continue</button></div>'; }
    h += "</div>";
  } else if (u.stage === "cause") {
    const answered = u.causePick !== null;
    h += '<div class="card stack"><span class="eyebrow">Root cause</span><h3>' + esc(c.cause.q) + '</h3><div class="opts">' + u.causeOrder.map(k => { let cl = ""; if (answered) { if (k === c.cause.a) cl = " right"; else if (k === u.causePick) cl = " wrong"; } return '<button class="opt' + cl + '" data-act="case-cause" data-v="' + k + '"' + (answered ? " disabled" : "") + ">" + esc(c.cause.o[k]) + "</button>"; }).join("") + "</div>";
    if (answered) h += '<div class="note ' + (u.causePick === c.cause.a ? "good" : "bad") + '"><span class="k">' + (u.causePick === c.cause.a ? "Correct" : "Not correct") + "</span>" + esc(c.cause.fb) + '</div><div><button class="btn pri" data-act="case-next">Continue</button></div>';
    h += "</div>";
  } else {
    const sc = u.score / max;
    h += '<div class="card stack"><div class="row"><h3 class="grow">Case closed</h3><span class="pill ' + (sc >= 0.85 ? "g" : sc >= 0.6 ? "w" : "b") + '">' + pct(sc) + '%</span></div><p class="lede">' + u.score + " of " + max + " points. Best moves score 2, slower ones 1.</p></div>";
    h += '<div class="card stack"><label class="eyebrow" for="bugTitle">Write the bug title yourself first</label><p class="lede">One line: what fails, where, how often, with numbers.</p><textarea class="field" id="bugTitle" placeholder="Your bug title"></textarea>' + (u.bugShown ? '<div class="note"><span class="k">Model title</span><span style="font-family:var(--f-mono);font-size:.9rem">' + esc(c.bug) + "</span></div>" : '<div><button class="btn" data-act="case-bug">Compare with a model title</button></div>') + "</div>";
    h += '<div class="card stack"><span class="eyebrow">Take away</span><ul class="plain">' + c.learn.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></div>";
    const nx = CASES[CASES.indexOf(c) + 1];
    h += '<div class="row"><button class="btn" data-act="case-restart">Work this case again</button>' + (nx ? '<a class="btn pri" href="#cases/' + nx.id + '">Next case</a>' : '<a class="btn pri" href="#cases">All cases</a>') + "</div>";
  }
  return h;
}

/* ---------- Review ---------- */
function startReview(){ const q = shuffle(dueCards().concat(newCards())); ui.rv = {queue: q.map(c => ({c, again: false})), shown: false, done: 0, missed: 0, total: q.length}; }
function viewReview(){
  rollDay();
  const rs = reviewStats();
  if (!ui.rv) {
    const due = dueCards().length, nw = newCards().length;
    let h = '<div class="stack"><h2>Daily review</h2><p class="lede">Say each answer out loud before you look. Cards you miss come back tomorrow. Cards you know come back after longer and longer gaps: 2, 4, 8, 16 days and on.</p></div>';
    h += '<div class="card stack"><div class="todo"><span class="n">' + (due + nw) + '</span><span class="grow"><span class="t">' + (due + nw ? "Ready for today" : "All caught up") + '</span><br><span class="s">' + due + " due, " + nw + " new. " + state.day.done + " answered today.</span></span></div>" + (due + nw ? '<div><button class="btn pri" data-act="rv-start">Start review</button></div>' : '<p class="lede">Come back tomorrow, or raise the number of new cards per day in Settings on the Today tab.</p>') + "</div>";
    const boxes = [0, 0, 0, 0]; CARDS.forEach(c => { const r = state.r[c.id]; if (!r) boxes[0]++; else if (r.b <= 1) boxes[1]++; else if (r.b <= 3) boxes[2]++; else boxes[3]++; });
    h += '<div class="stack"><h3>Your deck</h3><div class="stats" style="grid-template-columns:repeat(2,minmax(0,1fr))">' + [["Not started", boxes[0]], ["Learning (1 to 2 days)", boxes[1]], ["Settling (4 to 8 days)", boxes[2]], ["Holding (16 days and more)", boxes[3]]].map(b => '<div class="stat"><span class="n">' + b[1] + '</span><div class="meter"><span style="width:' + pct(b[1] / rs.total) + '%"></span></div><span class="l">' + b[0] + "</span></div>").join("") + '</div><p class="lede">' + rs.total + " cards: the why-question of every journey step, key numbers and timers, and every term. New cards from chapters you have walked come first.</p></div>";
    return h;
  }
  const v = ui.rv;
  if (!v.queue.length) {
    let h = '<div class="stack"><h2>Review done</h2><p class="lede">' + v.done + " cards answered, " + v.missed + " missed. Missed cards come back tomorrow.</p></div>";
    h += '<div class="row"><a class="btn pri" href="#today" data-act="rv-close">Back to Today</a>' + (newCards().length ? '<button class="btn" data-act="rv-start">More new cards</button>' : "") + "</div>";
    return h;
  }
  const it = v.queue[0], c = it.c, isNew = !state.r[c.id];
  const nb = g => { const b = Math.min(INTERVALS.length - 1, (state.r[c.id] ? state.r[c.id].b : 0) + g); return INTERVALS[b]; };
  let h = '<div class="row"><button class="back btn sm" data-act="rv-close">&larr; Stop</button><span class="grow"></span><span class="eyebrow">' + v.queue.length + ' left</span></div><div class="meter"><span style="width:' + pct(v.done / Math.max(1, v.done + v.queue.length)) + '%"></span></div>';
  h += '<div class="card flash"><div class="row"><span class="pill n">' + esc(c.g) + "</span>" + (isNew ? '<span class="pill a">New</span>' : "") + (it.again ? '<span class="pill w">Again</span>' : "") + "</div>" +
    (c.term ? '<span class="eyebrow">What is it, and where does it matter?</span><div class="front mono">' + esc(c.f) + "</div>" : '<div class="front">' + esc(c.f) + "</div>") +
    (v.shown ? '<div class="back">' + esc(c.b) + "</div>" : "") + "</div>";
  if (!v.shown) h += '<button class="btn pri" data-act="rv-show" style="width:100%">Show answer</button>';
  else h += '<div class="grade"><button class="btn bad" data-act="rv-grade" data-v="0">Missed<small>tomorrow</small></button><button class="btn warn" data-act="rv-grade" data-v="1">With effort<small>' + (it.again ? "tomorrow" : nb(1) + " days") + '</small></button><button class="btn good" data-act="rv-grade" data-v="2">Easy<small>' + (it.again ? "tomorrow" : nb(2) + " days") + "</small></button></div>";
  return h;
}

/* ---------- Library ---------- */
function termGrid(){ const q = ui.lib.termQ.trim().toLowerCase(); const list = TERMS.filter(t => !q || t[0].toLowerCase().includes(q) || t[2].toLowerCase().includes(q)); return list.length ? '<div class="terms">' + list.map(t => '<div class="term"><div class="row" style="justify-content:space-between;align-items:flex-start"><span class="t">' + esc(t[0]) + '</span><span class="pill n">' + TERM_CATS[t[1]] + '</span></div><div class="m">' + esc(t[2]) + "</div></div>").join("") + "</div>" : '<p class="lede">No terms match.</p>'; }
function viewLibrary(sub){
  const terms = sub === "terms";
  let h = '<div class="stack"><h2>Library</h2><p class="lede">Reference to read when a step or a card does not make sense yet. Reading is for understanding. The other tabs are for remembering.</p></div>';
  h += '<div class="row"><a class="chip" href="#library" aria-pressed="' + !terms + '">Lessons</a><a class="chip" href="#library/terms" aria-pressed="' + terms + '">Terms</a></div>';
  if (terms) return h + '<input class="field" id="termQ" type="search" placeholder="Search ' + TERMS.length + ' terms" value="' + esc(ui.lib.termQ) + '" data-in="termQ"><div id="termGrid">' + termGrid() + "</div>";
  const mod = LEARN.find(m => m.id === ui.lib.mod) || LEARN[0];
  h += '<div class="row">' + LEARN.map(m => { const d = m.lessons.filter(l => state.lessons[l.id]).length; return '<button class="chip" data-act="mod" data-id="' + m.id + '" aria-pressed="' + (m.id === mod.id) + '">' + bars5(d / m.lessons.length) + esc(m.t) + "</button>"; }).join("") + "</div>";
  h += '<div class="stack"><h3>' + esc(mod.t) + '</h3><p class="lede">' + esc(mod.s) + "</p></div>";
  mod.lessons.forEach(l => { const on = !!state.lessons[l.id];
    h += '<details class="item" data-id="' + l.id + '"' + (ui.lib.open.has(l.id) ? " open" : "") + "><summary>" + tick(on) + '<span class="ttl">' + esc(l.t) + '</span></summary><div class="body"><ul>' + l.p.map(x => "<li>" + x + "</li>").join("") + "</ul>" + (l.say ? '<div class="note good"><span class="k">Say it in one breath</span>' + l.say + "</div>" : "") + (l.trap ? '<div class="note warn"><span class="k">Watch out</span>' + l.trap + "</div>" : "") + '<div><button class="btn' + (on ? " on" : "") + '" data-act="lesson" data-id="' + l.id + '">' + (on ? "Read. Tap to undo" : "Mark as read") + "</button></div></div></details>"; });
  return h;
}

/* ---------- events ---------- */
document.addEventListener("toggle", e => { const d = e.target; if (d && d.matches && d.matches("details.item")) { if (d.open) ui.lib.open.add(d.dataset.id); else ui.lib.open.delete(d.dataset.id); } }, true);
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const act = b.dataset.act, v = b.dataset.v === undefined ? null : +b.dataset.v, r = ui.route;
  const ch = r[0] === "journey" ? JOURNEY.find(c => c.id === r[1]) : null, cs = r[0] === "cases" ? CASES.find(c => c.id === r[1]) : null, j = ui.j, u = ui.c, rv = ui.rv;
  let top = false;
  switch (act) {
    case "timer-start": startTimer(v); break;
    case "timer-stop": stopTimer(); break;
    case "install": if (ui.installEvt) { ui.installEvt.prompt(); ui.installEvt = null; } break;
    case "export": exportBackup(); return;
    case "reset-ask": ui.shown.add("reset"); break;
    case "reset-no": ui.shown.delete("reset"); break;
    case "reset-yes": state = blank(); ui.shown.delete("reset"); ui.j = ui.c = ui.rv = null; save(); toast("Progress cleared"); break;
    case "pass": startPass(ch, v); top = true; break;
    case "pass-quit": ui.j = null; top = true; break;
    case "pass-clear": ui.j = null; return;
    case "p1-pick": j.pick = v; if (j.opts[v] === ch.steps[j.i].m) j.right++; break;
    case "p1-why": j.why = true; break;
    case "p1-next": if (j.i + 1 < ch.steps.length) { j.i++; p1Options(ch); } else { j.finished = true; finishPass(ch, 1, true); } top = true; break;
    case "p2-pick": { const gap = j.order[j.at]; if (j.pick !== null && j.pickOk) return; if (v === gap) { j.pick = v; j.pickOk = true; if (!j.wrong || !j.wrong.size) j.right++; } else { (j.wrong || (j.wrong = new Set())).add(v); j.pick = v; j.pickOk = false; } break; }
    case "p2-next": j.at++; j.pick = null; j.pickOk = false; j.wrong = null; if (j.at >= j.total) finishPass(ch, 2, j.right / j.total >= 0.8); top = true; break;
    case "p3-pick": if (v === j.placed) { j.placed++; j.flash = null; if (j.placed === ch.steps.length) { j.stage = "explain"; top = true; } } else { j.mistakes++; j.flash = v; } break;
    case "p3-show": j.exShown = true; break;
    case "p3-ex": { const card = CARD_BY_ID["jq-" + ch.id + "-" + j.ex[j.exAt]]; if (v) j.exGot++; else if (card) state.r[card.id] = {b: 0, due: dayNum(), n: ((state.r[card.id] || {}).n || 0) + 1}; j.exAt++; j.exShown = false; if (j.exAt >= j.ex.length) { j.stage = "done"; finishPass(ch, 3, j.mistakes <= 2); } else save(); top = true; break; }
    case "case-pick": if (u.pick !== null) return; u.pick = v; u.score += cs.nodes[u.i].o[v][1]; break;
    case "case-cause": if (u.causePick !== null) return; u.causePick = v; if (v === cs.cause.a) u.score += 2; break;
    case "case-next": if (u.stage === "nodes") { u.pick = null; if (u.i + 1 < cs.nodes.length) u.i++; else u.stage = "cause"; } else { u.stage = "done"; const max = cs.nodes.length * 2 + 2, s = state.c[cs.id] || {best: 0, n: 0}; s.best = Math.max(s.best, u.score / max); s.n++; state.c[cs.id] = s; markActive(); save(); } break;
    case "case-bug": u.bugShown = true; { const ta = $("#bugTitle"); u.bugText = ta ? ta.value : ""; } break;
    case "case-restart": startCase(cs); top = true; break;
    case "rv-start": startReview(); top = true; break;
    case "rv-close": ui.rv = null; if (b.tagName === "A") return; break;
    case "rv-show": rv.shown = true; break;
    case "rv-grade": { const it = rv.queue.shift(); grade(it.c, v, it.again); rv.done++; if (v === 0) { rv.missed++; rv.queue.push({c: it.c, again: true}); } rv.shown = false; break; }
    case "mod": ui.lib.mod = b.dataset.id; break;
    case "lesson": if (state.lessons[b.dataset.id]) delete state.lessons[b.dataset.id]; else state.lessons[b.dataset.id] = 1; save(); break;
    default: return;
  }
  if (top) { render(); window.scrollTo(0, 0); } else rerender();
  const need = {"p1-why": "[data-act=p1-next]", "p1-pick": "[data-act=p1-why]", "rv-show": ".grade", "case-pick": "[data-act=case-next]", "case-cause": "[data-act=case-next]", "p3-show": "[data-act=p3-ex]", "p2-pick": "[data-act=p2-next]"}[act];
  if (need) { const el = $(need); if (el && el.scrollIntoView) el.scrollIntoView({block: "nearest"}); }
  if (act === "case-bug" && u.bugText) { const ta = $("#bugTitle"); if (ta) ta.value = u.bugText; }
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.dataset.ch === "newPerDay") { state.set.newPerDay = +t.value; save(); rerender(); }
  if (t.id === "importFile" && t.files && t.files[0]) { const fr = new FileReader(); fr.onload = () => { try { const d = JSON.parse(fr.result); if (!d || d.v !== 1 || typeof d.r !== "object") throw new Error("bad"); state = normalize(d); save(); ui.j = ui.c = ui.rv = null; rerender(); toast("Backup imported"); } catch (err) { toast("That file is not a backup from this app"); } }; fr.readAsText(t.files[0]); }
});
document.addEventListener("input", e => { const t = e.target; if (t.dataset.in === "termQ") { ui.lib.termQ = t.value; const g = $("#termGrid"); if (g) g.innerHTML = termGrid(); } });
function exportBackup(){
  const blob = new Blob([JSON.stringify(state, null, 1)], {type: "application/json"}), a = document.createElement("a");
  const d = new Date(); a.href = URL.createObjectURL(blob); a.download = "ran-trainer-backup-" + d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + ".json";
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast("Backup file saved");
}
window.addEventListener("hashchange", go);
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); ui.installEvt = e; if (ui.route[0] === "today") rerender(); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) renderChrome(); });
if ("serviceWorker" in navigator && location.protocol !== "file:") window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
go();
})();
