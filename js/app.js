/* RAN Validation Trainer: app logic. No build step, no dependencies. Progress is kept in this browser (localStorage). */
(function(){
"use strict";
const LS_KEY = "ran-validation-v1";
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pct = x => Math.round(Math.min(1, Math.max(0, x)) * 100);
const pad2 = n => String(n).padStart(2, "0");
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const stripTags = s => String(s).replace(/<[^>]+>/g, "");
const dayNum = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };
const dayDate = d => new Date(d * 86400000);   /* read with timeZone UTC: gives the local calendar day */
const INTERVALS = [1, 2, 4, 8, 16, 32, 64, 120];   /* days until a card comes back, by box */
const PASS_NAMES = ["Guided walk", "Fill the gaps", "Rebuild from memory"];
const PASS_DESC = ["Predict each step before you see it, then explain why it happens.", "The flow with half the steps missing. Put them back where they belong.", "Every step shuffled. Rebuild the order, then explain three steps out loud."];

/* ---------- review deck: built from the journey, the fact list and the terms ---------- */
const CARDS = [];
JOURNEY.forEach(ch => ch.steps.forEach((s, i) => CARDS.push({id: "jq-" + ch.id + "-" + i, f: s.q, b: s.a, g: ch.t, ch: ch.id, pr: 0})));
FACTS.forEach(f => CARDS.push({id: "f-" + slug(f[0]).slice(0, 48), f: f[0], b: f[1], g: f[2], pr: 1}));
TERMS.forEach(t => CARDS.push({id: "t-" + slug(t[0]), f: t[0], b: t[2], g: TERM_CATS[t[1]], term: true, pr: 2}));
const CARD_BY_ID = {}; CARDS.forEach(c => { CARD_BY_ID[c.id] = c; });
const ALL_LESSONS = LEARN.flatMap(m => m.lessons);

/* ---------- state ---------- */
function blank(){ return {v: 1, j: {}, c: {}, r: {}, day: {d: 0, nw: 0, done: 0, jp: 0, cs: 0}, streak: {last: 0, n: 0, best: 0}, set: {newPerDay: 10, theme: "auto"}, lessons: {}, hist: {}, updated: 0}; }
function normalize(s){ const b = blank(); if (s && typeof s === "object") for (const k in b) if (s[k] !== undefined && s[k] !== null && typeof s[k] === typeof b[k] && Array.isArray(s[k]) === Array.isArray(b[k])) b[k] = s[k]; return b; }
let state = blank();
try { const raw = localStorage.getItem(LS_KEY); if (raw) state = normalize(JSON.parse(raw)); } catch (e) {}
function save(){
  state.updated = Date.now();
  const cut = dayNum() - 400; for (const k in state.hist) if (+k < cut) delete state.hist[k];
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { toast("Could not save on this device"); }
  renderChrome();
}
function rollDay(){ const t = dayNum(); if (state.day.d !== t) state.day = {d: t, nw: 0, done: 0, jp: 0, cs: 0}; }
function markActive(){ const t = dayNum(), s = state.streak; if (s.last !== t) { s.n = s.last === t - 1 ? s.n + 1 : 1; s.last = t; } s.best = Math.max(s.best || 0, s.n); }
/* hist[day] = [first-try answers, first-try misses, passes + cases + lessons] */
function bump(i, k){ const t = dayNum(), h = state.hist[t] || (state.hist[t] = [0, 0, 0]); h[i] += (k || 1); }
const jLevel = id => (state.j[id] || {}).lv || 0;
const streakNow = () => { const s = state.streak; return s.last >= dayNum() - 1 ? s.n : 0; };

/* ---------- small pieces ---------- */
const LAYER = {PHY: "phy", MAC: "mac", RLC: "rlc", PDCP: "pdcp", SDAP: "pdcp", RRC: "rrc", NAS: "nas", S1AP: "ap", X2AP: "ap", NGAP: "ap", XNAP: "ap", F1AP: "ap", GTP: "ap"};
const lkey = l => LAYER[String(l).toUpperCase()] || "test";
const lcls = l => "L-" + lkey(l);
const layerChip = l => '<span class="layer ' + lcls(l) + '">' + esc(l) + "</span>";
const SVG = {
  today: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 16a8.5 8.5 0 1 1 17 0"/><path d="M12 16l4.5-5"/><circle cx="12" cy="16" r="1.3"/><path d="M7 16h.01M17 16h.01M12 8.5V10"/></svg>',
  journey: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3v18M19 3v18"/><path d="M5 8h12m0 0-2.5-2.5M17 8l-2.5 2.5"/><path d="M19 15H7m0 0 2.5-2.5M7 15l2.5 2.5"/></svg>',
  cases: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.6-4.6M10.5 7.5v3.5M10.5 13.5h.01"/></svg>',
  review: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="7" width="13" height="13.5" rx="2"/><path d="M7.5 3.5h10a3 3 0 0 1 3 3v10"/></svg>',
  library: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4.5h4v15H4zM10 4.5h4v15h-4z"/><path d="M15.6 6.3l3.4-.9 3 12.6-3.4.9z"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7"/></svg>'
};
const MARK = '<svg class="mk" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="var(--ink)"/><rect x="7" y="18" width="4" height="7" rx="1" fill="var(--bg)"/><rect x="14" y="12.5" width="4" height="12.5" rx="1" fill="var(--bg)"/><rect x="21" y="7" width="4" height="18" rx="1" fill="var(--acc)"/></svg>';
const tick = on => '<span class="tick' + (on ? " on" : "") + '" aria-hidden="true">' + SVG.check + "</span>";
const kbd = k => '<span class="kbd opt-k">' + k + "</span>";
const stamp = (cls, txt) => '<span class="stamp ' + cls + '">' + txt + "</span>";
const verdict = x => x >= 0.85 ? ["pass", "Pass"] : x >= 0.6 ? ["inc", "Inconc"] : ["fail", "Fail"];
const caseId = c => "RAN-" + String(CASES.indexOf(c) + 1).padStart(3, "0");
const segs = (n, on, cur) => { let h = '<div class="segs" aria-hidden="true">'; for (let i = 0; i < n; i++) h += "<i" + (i < on ? ' class="on"' : i === cur ? ' class="cur"' : "") + "></i>"; return h + "</div>"; };
const meter = (x, cls) => '<div class="meter' + (cls ? " " + cls : "") + '"><span style="width:' + pct(x) + '%"></span></div>';
function hlq(text, q){ text = String(text); if (!q) return esc(text); const re = new RegExp("(" + q.split(/\s+/).filter(Boolean).map(reEsc).join("|") + ")", "ig"); return text.split(re).map((p, i) => i % 2 ? "<mark>" + esc(p) + "</mark>" : esc(p)).join(""); }
let toastTimer = null;
function toast(msg){ let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); } t.textContent = msg; t.hidden = false; t.style.animation = "none"; void t.offsetWidth; t.style.animation = ""; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600); }

/* simplified-log highlighter: timestamps, [LAYER] tags, key=value pairs and test verdicts.
   It deliberately does not colour words like "reject" or "expired": spotting the clue is the exercise. */
const LOG_RE = /(^\s*\d{1,2}:\d{2}:\d{2}(?:\.\d+)?)|(\[[A-Za-z0-9_\/ -]{1,12}\])|\b([A-Za-z_][\w.]*)=([^\s,;]+)|\b(FAIL(?:ED)?|ERROR)\b|\b(PASS(?:ED)?)\b/g;
function hlLog(line){
  if (/^\s*\.{3}\s*$/.test(line)) return '<span class="lg-dim">' + esc(line) + "</span>";
  let out = "", last = 0, m; LOG_RE.lastIndex = 0;
  while ((m = LOG_RE.exec(line))) {
    out += esc(line.slice(last, m.index));
    if (m[1]) out += '<span class="lg-ts">' + esc(m[1]) + "</span>";
    else if (m[2]) out += '<span class="lg-tag ' + lcls(m[2].slice(1, -1).trim()) + '">' + esc(m[2]) + "</span>";
    else if (m[3]) out += '<span class="lg-k">' + esc(m[3]) + '=</span><span class="lg-v">' + esc(m[4]) + "</span>";
    else if (m[5]) out += '<span class="lg-bad">' + esc(m[5]) + "</span>";
    else out += '<span class="lg-ok">' + esc(m[6]) + "</span>";
    last = m.index + m[0].length;
  }
  return out + esc(line.slice(last));
}

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
  const t = dayNum(), prev = state.r[card.id], isNew = !prev, n = ((prev || {}).n || 0) + 1, m = (prev || {}).m || 0;
  if (g === 0) state.r[card.id] = {b: 0, due: t + 1, n, m: again ? m : m + 1};
  else if (!again) { const b = Math.min(INTERVALS.length - 1, (prev ? prev.b : 0) + g); state.r[card.id] = {b, due: t + INTERVALS[b], n, m}; }
  if (!again) { bump(0); if (g === 0) bump(1); }
  if (isNew) state.day.nw++;
  state.day.done++;
  markActive(); save();
}
function reviewStats(){ let learned = 0, strong = 0; CARDS.forEach(c => { const r = state.r[c.id]; if (r) { learned++; if (r.b >= 4) strong++; } }); return {learned, strong, total: CARDS.length}; }
function bler7(){ const t = dayNum(); let a = 0, m = 0; for (let d = t - 6; d <= t; d++) { const h = state.hist[d]; if (h) { a += h[0]; m += h[1]; } } return {a, m, r: a ? m / a : 0}; }
function forecast(days){ const t = dayNum(), out = new Array(days).fill(0); for (const id in state.r) { if (!CARD_BY_ID[id]) continue; const k = Math.max(0, state.r[id].due - t); if (k < days) out[k]++; } return out; }

/* ---------- the ladder: a message sequence chart, colour-coded by protocol layer ---------- */
function ladder(ch, opt){
  opt = opt || {};
  const upto = opt.upto === undefined ? ch.steps.length : opt.upto, hidden = opt.hidden || new Set(), now = opt.now, fresh = opt.fresh;
  const n = ch.lanes.length, W = n === 2 ? 470 : n === 3 ? 650 : 760, mx = n === 4 ? 92 : 100, top = 48, rh = 46;
  const maxLen = n === 2 ? 50 : n === 3 ? 52 : 42, minW = n === 2 ? 360 : n === 3 ? 540 : 640;
  const x = i => mx + i * (W - 2 * mx) / (n - 1);
  const rows = Math.max(1, upto), H = top + rows * rh + 12;
  let s = '<svg style="min-width:' + minW + 'px" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Message sequence: ' + esc(ch.t) + '">';
  ch.lanes.forEach((l, i) => { const w = l.length * 7.4 + 22; s += '<line class="v" x1="' + x(i) + '" y1="34" x2="' + x(i) + '" y2="' + (H - 4) + '"/><rect class="lane-b" x="' + (x(i) - w / 2) + '" y="8" width="' + w + '" height="26" rx="5"/><text class="lane" x="' + x(i) + '" y="25.5" text-anchor="middle">' + esc(l) + "</text>"; });
  for (let k = 0; k < upto; k++) {
    const st = ch.steps[k], y = top + k * rh + 30, hid = hidden.has(k), lc = hid ? "" : lcls(st.l);
    let label = hid ? "?  gap " + (k + 1) : st.m; if (label.length > maxLen) label = label.slice(0, maxLen - 1) + "…";
    const tw = label.length * 6.6;
    s += '<g class="msg ' + lc + (fresh === k ? " new" : "") + '">';
    s += '<text class="sn" x="14" y="' + (y - 6) + '">' + pad2(k + 1) + "</text>" + (hid ? "" : '<text class="ly" x="14" y="' + (y + 6) + '">' + esc(st.l) + "</text>");
    if (st.f === st.t || hid) {
      const base = hid ? (x(st.f) + x(st.t)) / 2 : x(st.f);
      const cx = Math.min(Math.max(base, tw / 2 + 58), W - tw / 2 - 14);
      s += '<rect class="' + (hid ? "gap" : now === k ? "now" : "self") + '" x="' + (cx - tw / 2 - 10) + '" y="' + (y - 20) + '" width="' + (tw + 20) + '" height="24" rx="4"/><text' + (hid ? ' class="q"' : "") + ' x="' + cx + '" y="' + (y - 4) + '" text-anchor="middle">' + esc(label) + "</text>";
    } else {
      const x1 = x(st.f), x2 = x(st.t), dir = x2 > x1 ? 1 : -1;
      const cx = Math.min(Math.max((x1 + x2) / 2, tw / 2 + 50), W - tw / 2 - 8);
      if (now === k) s += '<rect class="now" x="' + (cx - tw / 2 - 6) + '" y="' + (y - 21) + '" width="' + (tw + 12) + '" height="17" rx="3"/>';
      s += '<text x="' + cx + '" y="' + (y - 8) + '" text-anchor="middle">' + esc(label) + "</text>";
      s += '<line x1="' + x1 + '" y1="' + y + '" x2="' + (x2 - dir * 8) + '" y2="' + y + '"/><polygon points="' + x2 + "," + y + " " + (x2 - dir * 9) + "," + (y - 4.5) + " " + (x2 - dir * 9) + "," + (y + 4.5) + '"/><circle class="dot" cx="' + x1 + '" cy="' + y + '" r="3"/>';
    }
    s += "</g>";
  }
  return '<div class="ladder grid-bg">' + s + "</svg></div>";
}
const dirText = (ch, st) => st.f === st.t ? "inside " + esc(ch.lanes[st.f]) : esc(ch.lanes[st.f]) + " &rarr; " + esc(ch.lanes[st.t]);
function stepCard(ch, k, showWhy){
  const st = ch.steps[k];
  return '<div class="panel stepc"><div class="hd">' + layerChip(st.l) + '<span class="dir">Step ' + pad2(k + 1) + " / " + pad2(ch.steps.length) + " &middot; " + dirText(ch, st) + '</span></div><div class="m">' + esc(st.m) + "</div><p>" + esc(st.d) + '</p><div class="logline" aria-label="Simplified log line">' + hlLog(st.log) + "</div>" +
    (showWhy ? '<div class="why"><span class="q">' + esc(st.q) + '</span><span class="a">' + esc(st.a) + "</span></div>" : "") + "</div>";
}
function layerMix(ch){
  const cnt = {}; ch.steps.forEach(s => { const k = s.l; cnt[k] = (cnt[k] || 0) + 1; });
  return '<div class="mix" title="Steps by protocol layer">' + Object.keys(cnt).map(k => '<span class="' + lcls(k) + '" style="flex:' + cnt[k] + '"></span>').join("") + "</div>";
}
function layerLegend(list){ return '<div class="legend">' + list.map(l => '<span class="tag ' + lcls(l) + '">' + esc(l) + "</span>").join("") + "</div>"; }
const lanesHtml = ch => '<span class="lanes">' + ch.lanes.map(l => "<span>" + esc(l) + "</span>").join("<em>&harr;</em>") + "</span>";

/* ---------- routing and chrome ---------- */
const TABS = [["today", "Today", "T"], ["journey", "Journey", "J"], ["cases", "Cases", "C"], ["review", "Review", "R"], ["library", "Library", "L"]];
const ROUTES = TABS.map(t => t[0]).concat(["settings"]);
const ui = {route: ["today"], j: null, c: null, rv: null, lib: {mod: LEARN[0].id, termQ: "", cat: "", open: new Set()}, caseTag: "", logWrap: false, shown: new Set(), timer: null, enter: false};
function parseHash(){ const h = (location.hash || "").replace(/^#\/?/, ""); const parts = h.split("/").filter(Boolean).map(decodeURIComponent); return ROUTES.includes(parts[0]) ? parts : ["today"]; }
function go(){
  ui.route = parseHash(); ui.enter = true; render(); window.scrollTo(0, 0);
  const r = ui.route;
  if (r[0] === "library" && r[2]) { const el = document.querySelector('details[data-id="' + CSS.escape(r[2]) + '"]'); if (el) setTimeout(() => el.scrollIntoView({block: "start", behavior: "smooth"}), 60); }
}
function navLinks(){
  const due = dueCards().length + newCards().length;
  return TABS.map(t => '<a class="navi" href="#' + t[0] + '"' + (t[0] === ui.route[0] ? ' aria-current="page"' : "") + ">" + SVG[t[0]] + "<span>" + t[1] + "</span>" +
    (t[0] === "review" && due ? '<span class="badge" aria-label="' + due + ' cards ready">' + (due > 99 ? "99+" : due) + "</span>" : "") + '<span class="k" aria-hidden="true">' + t[2] + "</span></a>").join("");
}
function timerChip(){ return ui.timer ? '<a class="tchip" href="#today" title="Focus block running"><span class="js-timer">' + fmtTime(ui.timer.left) + "</span></a>" : ""; }
function renderChrome(){
  const brand = '<a class="brand" href="#today" aria-label="RAN Validation Trainer, today">' + MARK + '<span class="wm"><b>RAN Validation</b><span>Trainer &middot; bench</span></span></a>';
  const sn = streakNow(), best = state.streak.best || 0;
  $("#rail").innerHTML = brand + '<button class="search" data-act="search">' + SVG.search + 'Search everything<span class="kbd">/</span></button><nav>' + navLinks() + "</nav>" +
    '<div class="foot"><div class="row"><span class="eyebrow">Uptime</span><span class="mono num small"><b style="color:var(--acc-text)">' + sn + "</b> day" + (sn === 1 ? "" : "s") + (best ? ' <span style="color:var(--faint)">/ best ' + best + "</span>" : "") + "</span></div>" +
    (ui.timer ? '<div class="row"><span class="eyebrow">Focus</span>' + timerChip() + "</div>" : "") +
    '<a class="navi" href="#settings"' + (ui.route[0] === "settings" ? ' aria-current="page"' : "") + ">" + SVG.settings + "<span>Settings &amp; backup</span></a></div>";
  $("#top").innerHTML = '<div class="top-row">' + brand + timerChip() + '<button class="ibtn" data-act="search" aria-label="Search">' + SVG.search + '</button><a class="ibtn" href="#settings" aria-label="Settings and backup">' + SVG.settings + "</a></div>";
  $("#tabbar").innerHTML = navLinks();
}
function render(){
  renderChrome();
  const r = ui.route;
  let h;
  if (r[0] === "journey") h = r[1] && JOURNEY.some(c => c.id === r[1]) ? viewChapter(r[1]) : viewJourney();
  else if (r[0] === "cases") h = r[1] && CASES.some(c => c.id === r[1]) ? viewCase(r[1]) : viewCases();
  else if (r[0] === "review") h = viewReview();
  else if (r[0] === "library") h = viewLibrary(r[1], r[2]);
  else if (r[0] === "settings") h = viewSettings();
  else h = viewToday();
  const v = $("#view");
  v.classList.remove("enter");
  if (ui.enter) { void v.offsetWidth; v.classList.add("enter"); ui.enter = false; }
  v.innerHTML = h;
}
function rerender(){ const y = window.scrollY; render(); window.scrollTo(0, y); }

/* ---------- Today ---------- */
function nextChapter(){ for (let lv = 0; lv < 3; lv++) { const c = JOURNEY.find(ch => jLevel(ch.id) === lv); if (c) return {ch: c, lv}; } return null; }
function nextCase(){ return CASES.find(c => !state.c[c.id]) || CASES.slice().sort((a, b) => state.c[a.id].best - state.c[b.id].best)[0]; }
function viewToday(){
  rollDay();
  const due = dueCards().length, nw = newCards().length, nc = nextChapter(), cs = nextCase(), d = state.day, ready = due + nw;
  const t = dayNum(), date = dayDate(t).toLocaleDateString(undefined, {weekday: "long", day: "numeric", month: "long", timeZone: "UTC"});
  const items = [
    {id: "TC-01", href: "#review", t: ready ? "Review " + ready + " card" + (ready === 1 ? "" : "s") : "Review", done: d.done > 0 && !ready, idle: !d.done && !ready,
      s: ready ? due + " due, " + nw + " new &middot; about " + Math.max(1, Math.round(ready * 0.35)) + " min" : d.done ? d.done + " answered today. Deck is clear." : "Nothing due right now."},
    nc ? {id: "TC-02", href: "#journey/" + nc.ch.id, t: "Ch " + pad2(JOURNEY.indexOf(nc.ch) + 1) + " &middot; " + esc(nc.ch.t), done: !!d.jp, s: (d.jp ? "A pass done today &middot; next up: " : "") + "Pass " + (nc.lv + 1) + ", " + PASS_NAMES[nc.lv].toLowerCase()}
       : {id: "TC-02", href: "#journey", t: "Journey complete", done: !!d.jp, s: "Rebuild any chapter again to keep it sharp."},
    {id: "TC-03", href: "#cases/" + cs.id, t: caseId(cs) + " &middot; " + esc(cs.t), done: !!d.cs, s: (d.cs ? "A case closed today &middot; next: " : "") + (state.c[cs.id] ? "best so far " + pct(state.c[cs.id].best) + "%, beat it" : "not worked yet, about 5 min")}
  ];
  const ran = items.filter(i => i.done).length, cur = items.findIndex(i => !i.done && !i.idle);
  const lede = ran === 3 ? "All three executed. That is a full day; anything more is extra." : ran ? ran + " of 3 executed. Keep the order: recall first, then new material, then debugging." : "Three short blocks. Review first, while yesterday is still fresh. Then one step on the journey. Then one case.";
  let h = '<header class="ph"><span class="eyebrow">' + esc(date) + (streakNow() ? " &middot; uptime <b>" + streakNow() + "d</b>" : "") + "</span><h1>Today&rsquo;s test plan</h1><p class=\"lede\">" + lede + "</p></header>";

  /* 01 plan + focus */
  h += '<section class="sec"><div class="sh"><i>01</i>Test plan<span class="aside">' + ran + "/3 executed</span></div><div class=\"panel\"><div class=\"plan\">" + items.map((it, i) =>
    '<a class="tc' + (it.done ? " done" : "") + (i === cur ? " cur" : "") + '" href="' + it.href + '"><span class="id">' + it.id + '</span><span class="t">' + it.t + '</span><span class="s">' + it.s + '</span><span class="st">' +
    (it.done ? stamp("pass", "Pass") : it.idle ? stamp("none", "Idle") : i === cur ? stamp("next", "Next") : stamp("none", "Queued")) + '<span class="go">' + (it.done ? "AGAIN" : "RUN &rarr;") + "</span></span></a>").join("") + "</div>" + focusPanel() + "</div></section>";

  /* 02 link status */
  const b = bler7(), rs = reviewStats(), sn = streakNow(), measured = b.a >= 10;
  const bCls = !measured ? "" : b.r < 0.05 ? "inc" : b.r <= 0.15 ? "pass" : "fail";
  const bMsg = !measured ? "Needs 10 first-try answers in 7 days to read." : b.r < 0.05 ? "Under 5%: too easy. Take more new cards per day." : b.r <= 0.15 ? "In the 5&ndash;15% window. Good pace." : "Over 15%: too many misses. Fewer new cards, or walk the chapter first.";
  let week = 0; for (let k = t - 6; k <= t; k++) week += (state.hist[k] || [0])[0];
  h += '<section class="sec"><div class="sh"><i>02</i>Link status</div><div class="ros">' +
    '<div class="ro"><span class="l">Uptime</span><span class="v' + (sn ? " acc" : "") + '">' + sn + "<small>day" + (sn === 1 ? "" : "s") + '</small></span><span class="d">' + (state.streak.best ? "Best run " + state.streak.best + " days" : "Practise today to start a run") + "</span></div>" +
    '<div class="ro"><span class="l">BLER &middot; 7d <span style="color:var(--pass)">&#9675; 10%</span></span><span class="v ' + bCls + '">' + (measured ? (b.r * 100).toFixed(1) : "&mdash;") + "<small>%</small></span>" +
      '<div class="scale" aria-hidden="true"><span class="trk"></span><span class="win" style="left:16.7%;width:33.3%"></span><span class="tgt" style="left:33.3%"></span>' + (measured ? '<span class="ndl" style="left:' + Math.min(100, b.r / 0.3 * 100) + '%"></span>' : "") + '</div><span class="d">' + bMsg + "</span></div>" +
    '<div class="ro"><span class="l">Retained</span><span class="v">' + rs.strong + "<small>/ " + rs.total + '</small></span><span class="d">Cards holding 16+ days. ' + rs.learned + " started.</span></div>" +
    '<div class="ro"><span class="l">Throughput</span><span class="v">' + d.done + '<small>today</small></span><span class="d">' + week + " first-try answers in 7 days</span></div></div>" +
    '<p class="small lede">BLER here is your first-try miss rate in review. A radio link adapts its coding to hit about 10% block errors; spaced practice works best near the same number. Much lower means you could learn faster, much higher means you are guessing.</p></section>';

  /* 03 drive log + forecast */
  const fc = forecast(14), fmax = Math.max(4, ...fc);
  let active = 0; for (let k = t - 125; k <= t; k++) if (state.hist[k]) active++;
  h += '<section class="sec"><div class="sh"><i>03</i>Drive log<span class="aside">' + active + " active days in 18 weeks</span></div><div class=\"two\">" +
    '<div class="panel pad stack"><div class="heatwrap">' + heatmap() + '</div><div class="row" style="justify-content:space-between"><span class="eyebrow">Daily activity</span><span class="heatkey">less <i style="background:var(--heat0)"></i><i style="background:var(--heat1)"></i><i style="background:var(--heat2)"></i><i style="background:var(--heat3)"></i><i style="background:var(--heat4)"></i> more</span></div></div>' +
    '<div class="panel pad stack"><div class="fc" role="img" aria-label="Cards due over the next 14 days">' + fc.map((v, i) => { const dd = dayDate(t + i); return '<div class="b' + (i === 0 ? " t0" : "") + '" title="' + dd.toLocaleDateString(undefined, {weekday: "short", day: "numeric", month: "short", timeZone: "UTC"}) + ": " + v + ' due"><strong>' + (v || "") + '</strong><span style="height:' + (v / fmax * 70) + 'px"></span><em>' + "SMTWTFS"[dd.getUTCDay()] + "</em></div>"; }).join("") +
    '</div><div class="row" style="justify-content:space-between"><span class="eyebrow">Due, next 14 days</span><span class="heatkey">' + fc.reduce((a, v) => a + v, 0) + " cards</span></div></div></div></section>";

  /* 04 weak signals */
  const weak = Object.keys(state.r).filter(id => CARD_BY_ID[id] && (state.r[id].m || 0) >= 1).sort((a, b2) => state.r[b2].m - state.r[a].m || state.r[a].b - state.r[b2].b).slice(0, 6);
  h += '<section class="sec"><div class="sh"><i>04</i>Weak signals<span class="aside">most-missed cards</span></div>' + (weak.length ? '<div class="panel">' + weak.map(id => { const c = CARD_BY_ID[id], r = state.r[id];
    return '<details class="dis" data-id="w-' + id + '"' + (ui.lib.open.has("w-" + id) ? " open" : "") + '><summary><span class="ttl">' + esc(c.f) + '<span class="sub">' + esc(c.g) + '</span></span><span class="miss">' + r.m + "&times; missed</span></summary><div class=\"body\"><p>" + esc(c.b) + "</p></div></details>"; }).join("") + "</div>"
    : '<div class="note quiet"><span class="k">No weak spots yet</span>Cards you miss in review collect here, so you can see the pattern in what does not stick.</div>') + "</section>";

  /* 05 tracks */
  const jp = JOURNEY.reduce((a, c) => a + jLevel(c.id), 0), cp = CASES.filter(c => (state.c[c.id] || {}).best >= 0.85).length, cw = Object.keys(state.c).length, lr = ALL_LESSONS.filter(l => state.lessons[l.id]).length;
  h += '<section class="sec"><div class="sh"><i>05</i>Coverage</div><div class="panel pad tracks">' +
    trackRow("Journey passes", jp, JOURNEY.length * 3, "#journey") + trackRow("Cases passed (85%+)", cp, CASES.length, "#cases", cw + " worked") +
    trackRow("Lessons read", lr, ALL_LESSONS.length, "#library") + trackRow("Review cards started", rs.learned, rs.total, "#review") + "</div></section>";
  h += '<p class="foot-note">Log lines in this app are simplified for teaching; they are not output from a real tool. Check timer values and spec details against 3GPP before you rely on them.</p>';
  return h;
}
function trackRow(label, n, of, href, extra){ return '<div class="trk-r"><a href="' + href + '" style="color:inherit;text-decoration:none;font-weight:500">' + label + '</a><span class="n">' + (extra ? extra + " &middot; " : "") + n + " / " + of + "</span>" + meter(n / of) + "</div>"; }
function heatmap(){
  const t = dayNum(), dow = (t + 3) % 7, weeks = 18, start = t - dow - (weeks - 1) * 7;
  let h = '<div class="heat" role="img" aria-label="Activity over the last 18 weeks">';
  for (let d = start; d < start + weeks * 7; d++) {
    if (d > t) { h += '<i class="x"></i>'; continue; }
    const a = state.hist[d], v = a ? a[0] + 3 * a[2] : 0, lv = !v ? 0 : v < 6 ? 1 : v < 16 ? 2 : v < 31 ? 3 : 4;
    h += '<i class="h' + lv + (d === t ? " today" : "") + '" title="' + dayDate(d).toLocaleDateString(undefined, {day: "numeric", month: "short", timeZone: "UTC"}) + ": " + (a ? a[0] + " cards, " + a[2] + " passes, cases or lessons" : "no activity") + '"></i>';
  }
  return h + "</div>";
}
function focusPanel(){
  const tm = ui.timer, total = tm ? tm.total : 1500, left = tm ? tm.left : 1500, C = 2 * Math.PI * 28;
  return '<div class="panel-b" style="border-top:1px solid var(--line)"><div class="timer-ring"><svg viewBox="0 0 64 64" aria-hidden="true"><circle class="bgc" cx="32" cy="32" r="28"/><circle class="fgc js-ring' + (tm ? "" : " idle") + '" cx="32" cy="32" r="28" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - left / total)).toFixed(1) + '"/></svg>' +
    '<div class="grow"><div class="timer js-timer">' + fmtTime(left) + '</div><span class="small lede">' + (tm ? "Focus block running. One task, notifications off." : "Focus block. One task, notifications off.") + '</span></div><div class="row" style="flex-wrap:nowrap">' +
    (tm ? '<button class="btn sm" data-act="timer-stop">Stop</button>' : '<button class="btn sm pri" data-act="timer-start" data-v="25">25 min</button><button class="btn sm" data-act="timer-start" data-v="10">10</button>') + "</div></div></div>";
}
const fmtTime = s => pad2(Math.floor(s / 60)) + ":" + pad2(s % 60);
function startTimer(min){
  stopTimer();
  ui.timer = {end: Date.now() + min * 60000, left: min * 60, total: min * 60};
  ui.timer.h = setInterval(() => {
    const left = Math.max(0, Math.round((ui.timer.end - Date.now()) / 1000)); ui.timer.left = left;
    $$(".js-timer").forEach(el => { el.textContent = fmtTime(left); });
    const C = 2 * Math.PI * 28; $$(".js-ring").forEach(el => el.setAttribute("stroke-dashoffset", (C * (1 - left / ui.timer.total)).toFixed(1)));
    if (left <= 0) { stopTimer(); toast("Block finished. Take a 5 minute break."); rerender(); }
  }, 1000);
}
function stopTimer(){ if (ui.timer) clearInterval(ui.timer.h); ui.timer = null; }

/* ---------- Journey ---------- */
function viewJourney(){
  const nc = nextChapter(), jp = JOURNEY.reduce((a, c) => a + jLevel(c.id), 0), layers = [];
  JOURNEY.forEach(ch => ch.steps.forEach(s => { if (!layers.includes(s.l)) layers.push(s.l); }));
  const order = ["PHY", "MAC", "RLC", "PDCP", "RRC", "NAS", "S1AP", "X2AP", "NGAP"]; layers.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  let h = '<header class="ph"><span class="eyebrow">Track &middot; <b>Journey</b> &middot; ' + jp + " / " + JOURNEY.length * 3 + ' passes</span><h1>One connection, end to end</h1><p class="lede">Follow one phone from power-on to data, handover and failure. Each chapter has three passes: predict each step, fill the gaps, then rebuild the whole flow from memory.</p>' + layerLegend(layers) + "</header>";
  h += '<ol class="route">' + JOURNEY.map((ch, i) => { const lv = jLevel(ch.id), isNext = nc && nc.ch.id === ch.id;
    return '<li class="' + (lv >= 3 ? "done" : "") + '"><span class="stn l' + lv + (isNext ? " next" : "") + '">' + pad2(i + 1) + '</span><a class="chap" href="#journey/' + ch.id + '"><div class="top-l"><div class="grow"><div class="ttl">' + esc(ch.t) + '</div><div class="sub">' + esc(ch.s) + "</div></div>" + (isNext ? stamp("next", "Next") : lv >= 3 ? stamp("pass", "Rebuilt") : "") + "</div>" +
      '<div class="meta">' + lanesHtml(ch) + "<span>" + ch.steps.length + ' steps</span><span class="passes" aria-label="' + lv + ' of 3 passes done">' + [1, 2, 3].map(m => "<i" + (lv >= m ? ' class="on"' : "") + ">P" + m + "</i>").join("") + "</span></div>" + layerMix(ch) + "</a></li>"; }).join("") + "</ol>";
  return h;
}
function viewChapter(id){
  const ch = JOURNEY.find(c => c.id === id), lv = jLevel(id), idx = JOURNEY.indexOf(ch);
  if (ui.j && ui.j.id !== id) ui.j = null;
  if (ui.j) return ui.j.mode === 1 ? viewPass1(ch) : ui.j.mode === 2 ? viewPass2(ch) : viewPass3(ch);
  const ls = []; ch.steps.forEach(s => { if (!ls.includes(s.l)) ls.push(s.l); });
  let h = '<a class="back" href="#journey">&larr; Journey</a><header class="ph"><span class="eyebrow">Chapter <b>' + pad2(idx + 1) + "</b> / " + pad2(JOURNEY.length) + " &middot; " + ch.steps.length + " steps</span><h1>" + esc(ch.t) + '</h1><p class="lede">' + esc(ch.s) + '</p><div class="row">' + lanesHtml(ch) + "</div>" + layerMix(ch) + layerLegend(ls) + "</header>";
  h += '<section class="sec"><div class="sh"><i>01</i>Passes<span class="aside">' + lv + "/3 done</span></div><div class=\"pgrid\">" + [1, 2, 3].map(m => { const done = lv >= m, next = lv === m - 1;
    return '<button class="pcard' + (next ? " cur" : "") + (done ? " ok" : "") + '" data-act="pass" data-v="' + m + '"><span class="n">P' + m + '</span><span class="t">' + PASS_NAMES[m - 1] + '</span><span class="s">' + PASS_DESC[m - 1] + '</span><span class="f">' + (done ? stamp("pass", "Pass") : next ? stamp("next", "Next") : stamp("none", "Queued")) + '<span class="go">' + (done ? "AGAIN" : "START &rarr;") + "</span></span></button>"; }).join("") + "</div></section>";
  if (lv >= 1) {
    h += '<section class="sec"><div class="sh"><i>02</i>Study view<span class="aside">the whole flow</span></div>' + ladder(ch) + '<div class="panel">' + ch.steps.map((s, k) =>
      '<details class="dis" data-id="st-' + id + "-" + k + '"' + (ui.lib.open.has("st-" + id + "-" + k) ? " open" : "") + '><summary><span class="mono small" style="color:var(--faint)">' + pad2(k + 1) + "</span>" + layerChip(s.l) + '<span class="ttl mono small">' + esc(s.m) + '</span></summary><div class="body"><span class="mono small" style="color:var(--muted)">' + dirText(ch, s) + "</span><p>" + esc(s.d) + '</p><div class="logline">' + hlLog(s.log) + '</div><div class="why"><span class="q">' + esc(s.q) + '</span><span class="a">' + esc(s.a) + "</span></div></div></details>").join("") + "</div></section>";
  } else h += '<div class="note"><span class="k">Why the flow is hidden</span>Trying to predict a step before you see it makes it stick better than reading it first. The full study view opens after pass 1.</div>';
  const nx = JOURNEY[idx + 1];
  if (nx && lv >= 1) h += '<a class="btn" href="#journey/' + nx.id + '" style="align-self:flex-start">Next: Ch ' + pad2(idx + 2) + " &middot; " + esc(nx.t) + " &rarr;</a>";
  return h;
}
function startPass(ch, m){
  if (m === 1) { ui.j = {id: ch.id, mode: 1, i: 0, right: 0, pick: null, opts: null, why: false}; p1Options(ch); }
  else if (m === 2) { const hid = shuffle(ch.steps.map((_, i) => i)).slice(0, Math.ceil(ch.steps.length / 2)).sort((a, b) => a - b); ui.j = {id: ch.id, mode: 2, hidden: new Set(hid), order: hid.slice(), at: 0, right: 0, total: hid.length, pick: null, wrongFirst: false, opts: shuffle(hid)}; }
  else ui.j = {id: ch.id, mode: 3, placed: 0, mistakes: 0, opts: shuffle(ch.steps.map((_, i) => i)), flash: null, stage: "order", ex: shuffle(ch.steps.map((_, i) => i)).slice(0, 3), exAt: 0, exShown: false, exGot: 0};
}
function p1Options(ch){
  const j = ui.j, correct = ch.steps[j.i].m;
  const pool = ch.steps.map(s => s.m).filter(m => m !== correct);
  const later = ch.steps.slice(j.i + 1).map(s => s.m);
  let picks = shuffle(later).slice(0, 2);
  picks = picks.concat(shuffle(pool.filter(m => !picks.includes(m))).slice(0, 3 - picks.length));
  j.opts = shuffle([correct].concat(picks)); j.pick = null; j.why = false;
}
function passHead(ch, m, right){
  return '<div class="row"><button class="back" data-act="pass-quit">&larr; Leave pass</button><span class="grow"></span><span class="eyebrow">' + right + '</span></div><span class="eyebrow">Ch ' + pad2(JOURNEY.indexOf(ch) + 1) + " &middot; " + esc(ch.t) + " &middot; <b>P" + m + " " + PASS_NAMES[m - 1] + "</b></span>";
}
function optBtn(act, v, text, i, cls, disabled, mono){ return '<button class="opt' + (mono ? " mono" : "") + (cls || "") + '" data-act="' + act + '" data-v="' + v + '"' + (i < 9 && !disabled ? ' data-key="' + (i + 1) + '"' : "") + (disabled ? " disabled" : "") + ">" + (i < 9 ? kbd(i + 1) : "") + '<span class="tx">' + esc(text) + "</span></button>"; }
function viewPass1(ch){
  const j = ui.j;
  if (j.finished) return passDone(ch, 1, true, "You predicted " + j.right + " of " + ch.steps.length + " steps before seeing them.", "");
  const st = ch.steps[j.i], answered = j.pick !== null;
  let h = '<div class="stack">' + passHead(ch, 1, "Step " + pad2(j.i + 1) + " / " + pad2(ch.steps.length) + " &middot; " + j.right + " right") + segs(ch.steps.length, j.i + (answered ? 1 : 0), j.i) + '<h2 class="qtitle">' + (answered ? esc(st.m) : "What happens next?") + "</h2></div>";
  h += ladder(ch, {upto: answered ? j.i + 1 : j.i, now: answered ? j.i : undefined, fresh: answered ? j.i : undefined});
  if (!answered) {
    h += '<p class="lede">' + (j.i === 0 ? "This is the first step of the chapter. Which one is it?" : "You have seen " + j.i + " step" + (j.i === 1 ? "" : "s") + ". Say your guess out loud, then pick.") + '</p><div class="opts">' + j.opts.map((o, k) => optBtn("p1-pick", k, o, k, "", false, true)).join("") + "</div>";
  } else {
    const ok = j.opts[j.pick] === st.m;
    h += '<div class="note ' + (ok ? "pass" : "fail") + '"><span class="k">' + (ok ? "Predicted" : "Not this time") + "</span>" + (ok ? "Good. Now explain why it happens before you read on." : "You picked <span class=\"mono\">" + esc(j.opts[j.pick]) + "</span>. A wrong guess still helps you remember the right one.") + "</div>";
    h += stepCard(ch, j.i, false);
    h += '<div class="panel pad stack"><span class="eyebrow">Explain it to yourself</span><p style="font-weight:600;font-size:1.05rem">' + esc(st.q) + "</p>" + (j.why ? '<p style="color:var(--ink2)">' + esc(st.a) + "</p>" : '<div><button class="btn" data-act="p1-why" data-primary="1">I have my answer. Show it <span class="kbd hint-k">Enter</span></button></div>') + "</div>";
    h += '<div><button class="btn pri" data-act="p1-next"' + (j.why ? ' data-primary="1"' : " disabled") + ">" + (j.i + 1 < ch.steps.length ? "Next step" : "Finish pass 1") + ' <span class="kbd hint-k">Enter</span></button></div>';
  }
  return h;
}
function viewPass2(ch){
  const j = ui.j;
  if (j.at >= j.total) return passDone(ch, 2, j.right / j.total >= 0.8, "You placed " + j.right + " of " + j.total + " gaps on the first try.", "Pass 2 counts at 80% or more on the first try.");
  const gap = j.order[j.at], answered = j.pick !== null;
  const still = new Set(j.order.slice(answered && j.pickOk ? j.at + 1 : j.at));
  let h = '<div class="stack">' + passHead(ch, 2, "Gap " + (j.at + 1) + " / " + j.total + " &middot; " + j.right + " first try") + segs(j.total, j.at + (answered && j.pickOk ? 1 : 0), j.at) + '<h2 class="qtitle">Which step fills gap ' + (gap + 1) + "?</h2></div>";
  h += ladder(ch, {hidden: still, fresh: answered && j.pickOk ? gap : undefined});
  h += '<div class="opts">' + j.opts.map((k, i) => { const used = !still.has(k) && !(answered && k === gap); let c = ""; if (answered && k === gap && j.pickOk) c = " right"; else if (j.wrong && j.wrong.has(k)) c = " wrong"; return optBtn("p2-pick", k, ch.steps[k].m, i, c + (used ? " used" : ""), used || (answered && j.pickOk), true); }).join("") + "</div>";
  if (answered && j.pickOk) h += '<div class="note pass"><span class="k">Step ' + pad2(gap + 1) + " &middot; " + esc(ch.steps[gap].l) + "</span>" + esc(ch.steps[gap].d) + '</div><div><button class="btn pri" data-act="p2-next" data-primary="1">' + (j.at + 1 < j.total ? "Next gap" : "Finish pass 2") + ' <span class="kbd hint-k">Enter</span></button></div>';
  else if (j.wrong && j.wrong.size) h += '<div class="note fail"><span class="k">Not that one</span>Look at what comes just before and just after the gap, and who is talking to whom.</div>';
  return h;
}
function viewPass3(ch){
  const j = ui.j;
  if (j.stage === "done") return passDone(ch, 3, j.mistakes <= 2, "You rebuilt " + ch.steps.length + " steps with " + j.mistakes + " wrong tap" + (j.mistakes === 1 ? "" : "s") + ", and explained " + j.exGot + " of " + j.ex.length + ".", "Pass 3 counts with 2 wrong taps or fewer.");
  let h;
  if (j.stage === "order") {
    h = '<div class="stack">' + passHead(ch, 3, j.placed + " / " + ch.steps.length + " placed &middot; " + j.mistakes + " wrong") + segs(ch.steps.length, j.placed, j.placed) + '<h2 class="qtitle">Rebuild the flow</h2><p class="lede">Tap the steps in the order they happen.</p></div>';
    if (j.placed) h += '<div class="panel pad"><ol class="built">' + ch.steps.slice(0, j.placed).map(s => "<li>" + esc(s.m) + "</li>").join("") + "</ol></div>";
    let i = 0;
    h += '<div class="opts">' + j.opts.map(k => k < j.placed ? "" : optBtn("p3-pick", k, ch.steps[k].m, i++, j.flash === k ? " wrong" : "", false, true)).join("") + "</div>";
  } else {
    const k = j.ex[j.exAt], st = ch.steps[k];
    h = '<div class="stack">' + passHead(ch, 3, "Explain " + (j.exAt + 1) + " / " + j.ex.length) + segs(j.ex.length, j.exAt, j.exAt) + '<h2 class="qtitle">Say the answer out loud</h2></div>';
    h += '<div class="panel flash"><div class="tags">' + layerChip(st.l) + '<span class="mono small" style="color:var(--muted)">Step ' + pad2(k + 1) + " &middot; " + esc(st.m) + '</span></div><div class="prompt">' + esc(st.q) + "</div>" + (j.exShown ? '<div class="ans">' + esc(st.a) + "</div>" : "") + "</div>";
    h += j.exShown ? '<div class="grade" style="grid-template-columns:repeat(2,minmax(0,1fr))"><button class="btn fail" data-act="p3-ex" data-v="0" data-key="1">' + kbd(1) + "I missed it</button><button class=\"btn pass\" data-act=\"p3-ex\" data-v=\"1\" data-key=\"2\">" + kbd(2) + "I had it</button></div>"
      : '<button class="btn pri wide" data-act="p3-show" data-primary="1">Show answer <span class="kbd hint-k">Space</span></button>';
  }
  return h;
}
function passDone(ch, m, passed, line, rule){
  const idx = JOURNEY.indexOf(ch), nx = JOURNEY[idx + 1];
  let h = '<div class="stack"><span class="eyebrow">Ch ' + pad2(idx + 1) + " &middot; " + esc(ch.t) + " &middot; P" + m + '</span><div class="row" style="gap:18px"><h2 class="qtitle">' + (passed ? "Pass " + m + " complete" : "Not yet") + "</h2>" + (passed ? '<span class="stamp big pass">Pass</span>' : '<span class="stamp big fail">Fail</span>') + '</div><p class="lede">' + line + " " + (passed ? "" : rule) + "</p></div>";
  h += '<div class="note ' + (passed ? "pass" : "inc") + '"><span class="k">' + (passed ? "What happens now" : "What to do") + "</span>" + (passed ? (m === 1 ? "The why-questions from this chapter are now first in line for your daily review." : m === 2 ? "Leave a gap before pass 3. Tomorrow is better than right now." : "This chapter is rebuilt. Review will bring its questions back at longer and longer gaps.") : "Open the study view, read the steps you missed, and try again later today or tomorrow.") + "</div>";
  h += '<div class="row"><button class="btn pri" data-act="pass-quit" data-primary="1">Back to the chapter</button><button class="btn" data-act="pass" data-v="' + m + '">Run this pass again</button>' + (nx && passed ? '<a class="btn ghost" href="#journey/' + nx.id + '" data-act="pass-clear">Next chapter &rarr;</a>' : "") + "</div>";
  return h;
}
function finishPass(ch, m, passed){ rollDay(); const s = state.j[ch.id] || (state.j[ch.id] = {lv: 0}); if (passed && s.lv < m) s.lv = m; if (passed) state.day.jp = 1; bump(2); markActive(); save(); }

/* ---------- Cases ---------- */
function viewCases(){
  const tags = []; CASES.forEach(c => { if (!tags.includes(c.tag)) tags.push(c.tag); });
  const passed = CASES.filter(c => (state.c[c.id] || {}).best >= 0.85).length, list = CASES.filter(c => !ui.caseTag || c.tag === ui.caseTag), nc = nextCase();
  let h = '<header class="ph"><span class="eyebrow">Track &middot; <b>Cases</b> &middot; ' + passed + " / " + CASES.length + ' passed</span><h1>Case files</h1><p class="lede">Real failure patterns to debug. Read the log, choose what to check next, name the root cause, then write the bug title. Best moves score 2, slower ones 1.</p></header>';
  h += '<div class="chips scroll" role="group" aria-label="Filter by area"><button class="chip" data-act="ctag" data-id="" aria-pressed="' + !ui.caseTag + '">All <span class="c">' + CASES.length + "</span></button>" + tags.map(t => '<button class="chip" data-act="ctag" data-id="' + esc(t) + '" aria-pressed="' + (ui.caseTag === t) + '">' + esc(t) + ' <span class="c">' + CASES.filter(c => c.tag === t).length + "</span></button>").join("") + "</div>";
  h += '<div class="panel queue">' + list.map(c => { const s = state.c[c.id], v = s ? verdict(s.best) : null;
    return '<a class="qrow" href="#cases/' + c.id + '"><span class="id">' + caseId(c) + '</span><span class="t">' + esc(c.t) + '</span><span class="m"><span>' + esc(c.tag) + "</span><span>" + c.nodes.length + " decisions</span>" + (s ? "<span>" + s.n + " run" + (s.n === 1 ? "" : "s") + "</span>" : "") + '</span><span class="st">' + (s ? stamp(v[0], v[1]) + '<span class="sc">best ' + pct(s.best) + "%</span>" : c === nc ? stamp("next", "Next") : stamp("none", "New")) + "</span></a>"; }).join("") + "</div>";
  h += '<p class="small lede">Verdicts: <b>PASS</b> 85% or more, <b>INCONC</b> 60 to 84%, <b>FAIL</b> under 60%. The logs are simplified teaching logs, not output from a real tool.</p>';
  return h;
}
function startCase(c){ ui.c = {id: c.id, i: 0, score: 0, pick: null, picks: [], order: c.nodes.map(n => shuffle(n.o.map((_, k) => k))), causeOrder: shuffle(c.cause.o.map((_, k) => k)), stage: "nodes", causePick: null, bugShown: false, marks: new Set()}; }
function viewCase(id){
  const c = CASES.find(x => x.id === id);
  if (!ui.c || ui.c.id !== id) startCase(c);
  const u = ui.c, max = c.nodes.length * 2 + 2, s = state.c[c.id];
  let h = '<a class="back" href="#cases">&larr; Case files</a><header class="ph"><span class="eyebrow"><b>' + caseId(c) + "</b> &middot; " + esc(c.tag) + "</span><h1>" + esc(c.t) + '</h1><p style="font-size:1.05rem;max-width:64ch">' + esc(c.brief) + "</p></header>";
  h += '<dl class="testbed panel pad"><dt>Testbed</dt><dd>' + esc(c.setup) + "</dd>" + (s ? "<dt>Record</dt><dd>" + stamp(verdict(s.best)[0], verdict(s.best)[1]) + ' <span class="mono small" style="color:var(--muted)">best ' + pct(s.best) + "% &middot; " + s.n + " run" + (s.n === 1 ? "" : "s") + "</span></dd>" : "") + "</dl>";
  h += '<div class="logv' + (ui.logWrap ? " wrap" : "") + '"><div class="bar"><span class="dots"><i></i><i></i><i></i></span><span>case.log &middot; ' + c.log.length + ' lines &middot; simplified</span><button class="btn ghost sm wrapt" data-act="logwrap" style="min-height:26px;font-family:var(--f-mono);font-size:.7rem">' + (ui.logWrap ? "no wrap" : "wrap") + "</button></div><pre>" +
    c.log.map((l, i) => '<span class="ln' + (u.marks.has(i) ? " mk" : "") + '" data-act="logmark" data-v="' + i + '" title="Tap to mark this line">' + hlLog(l) + "</span>").join("") + "</pre></div>";
  h += '<p class="small lede" style="margin-top:-18px">Tip: tap a line to mark it as evidence while you reason.</p>';
  /* debug trail */
  h += '<section class="sec"><div class="sh"><i>01</i>Debug trail<span class="aside">' + Math.min(u.i + (u.stage === "nodes" ? 0 : 1), c.nodes.length) + "/" + c.nodes.length + ' decisions</span></div><ol class="trail">';
  c.nodes.forEach((n, i) => {
    if (u.stage === "nodes" && i > u.i) { h += '<li><span class="pt">' + (i + 1) + '</span><div class="bd"><span class="q past" style="color:var(--faint)">Decision ' + (i + 1) + "</span></div></li>"; return; }
    if (u.stage === "nodes" && i === u.i) {
      const answered = u.pick !== null;
      h += '<li><span class="pt cur">' + (i + 1) + '</span><div class="bd"><span class="q">' + esc(n.q) + '</span><div class="opts">' + u.order[i].map((k, vi) => { const o = n.o[k]; let cl = ""; if (answered) { if (o[1] === 2) cl = " right"; else if (k === u.pick) cl = o[1] === 1 ? " ok" : " wrong"; } return optBtn("case-pick", k, o[0], vi, cl, answered); }).join("") + "</div>";
      if (answered) { const o = n.o[u.pick]; h += '<div class="note ' + (o[1] === 2 ? "pass" : o[1] === 1 ? "inc" : "fail") + '"><span class="k">' + (o[1] === 2 ? "Best next move &middot; +2" : o[1] === 1 ? "Reasonable, but slower &middot; +1" : "Wrong turn &middot; +0") + "</span>" + esc(o[2]) + (o[1] === 2 ? "" : " Best move: " + esc(n.o.find(x => x[1] === 2)[0]) + ".") + '</div><div><button class="btn pri" data-act="case-next" data-primary="1">Continue <span class="kbd hint-k">Enter</span></button></div>'; }
      h += "</div></li>"; return;
    }
    const o = n.o[u.picks[i]], sc = o ? o[1] : 0;
    h += '<li><span class="pt ' + (sc === 2 ? "pass" : sc === 1 ? "inc" : "fail") + '">' + (i + 1) + '</span><div class="bd"><span class="q past">' + esc(n.q) + '</span><span class="pk">' + (sc === 2 ? stamp("pass", "+2") : sc === 1 ? stamp("inc", "+1") : stamp("fail", "+0")) + " " + esc(o ? o[0] : "") + "</span></div></li>";
  });
  /* root cause */
  if (u.stage === "nodes") h += '<li><span class="pt">RC</span><div class="bd"><span class="q past" style="color:var(--faint)">Root cause</span></div></li>';
  else {
    const answered = u.causePick !== null, ok = u.causePick === c.cause.a;
    h += '<li><span class="pt ' + (u.stage === "cause" ? "cur" : ok ? "pass" : "fail") + '">RC</span><div class="bd"><span class="q">' + esc(c.cause.q) + "</span>";
    if (u.stage === "cause") {
      h += '<div class="opts">' + u.causeOrder.map((k, vi) => { let cl = ""; if (answered) { if (k === c.cause.a) cl = " right"; else if (k === u.causePick) cl = " wrong"; } return optBtn("case-cause", k, c.cause.o[k], vi, cl, answered); }).join("") + "</div>";
      if (answered) h += '<div class="note ' + (ok ? "pass" : "fail") + '"><span class="k">' + (ok ? "Correct &middot; +2" : "Not correct &middot; +0") + "</span>" + esc(c.cause.fb) + '</div><div><button class="btn pri" data-act="case-next" data-primary="1">Close the case <span class="kbd hint-k">Enter</span></button></div>';
    } else h += '<span class="pk">' + stamp(ok ? "pass" : "fail", ok ? "+2" : "+0") + " " + esc(c.cause.o[u.causePick]) + "</span>";
    h += "</div></li>";
  }
  h += "</ol></section>";
  if (u.stage === "done") {
    const sc = u.score / max, v = verdict(sc);
    h += '<section class="sec"><div class="sh"><i>02</i>Verdict</div><div class="panel pad score"><span class="big">' + u.score + "<small>/" + max + '</small></span><div class="grow stack" style="gap:6px"><span>' + stamp(v[0], v[1]) + '</span><span class="small lede">' + pct(sc) + "% of points. Best moves score 2, slower ones 1.</span></div><span class=\"stamp big " + v[0] + '">' + v[1] + "</span></div></section>";
    h += '<section class="sec"><div class="sh"><i>03</i>Bug report</div><div class="panel pad stack"><label for="bugTitle" style="font-weight:600">Write the bug title yourself first</label><p class="small lede">One line: what fails, where, how often, with numbers.</p><textarea class="field" id="bugTitle" placeholder="e.g. [component] symptom under condition, n/N runs, build X"></textarea>' +
      (u.bugShown ? '<div class="note"><span class="k">Model title</span><span class="mono small">' + esc(c.bug) + "</span></div>" : '<div><button class="btn" data-act="case-bug">Compare with a model title</button></div>') + "</div></section>";
    h += '<section class="sec"><div class="sh"><i>04</i>Take away</div><div class="panel pad"><ul style="margin:0;padding-left:1.15em;display:flex;flex-direction:column;gap:8px">' + c.learn.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></div></section>";
    const nx = CASES[CASES.indexOf(c) + 1];
    h += '<div class="row">' + (nx ? '<a class="btn pri" href="#cases/' + nx.id + '">Next: ' + caseId(nx) + " &rarr;</a>" : '<a class="btn pri" href="#cases">All cases</a>') + '<button class="btn" data-act="case-restart">Work this case again</button></div>';
  }
  return h;
}

/* ---------- Review ---------- */
function startReview(){ const q = shuffle(dueCards().concat(newCards())); ui.rv = {queue: q.map(c => ({c, again: false})), shown: false, done: 0, missed: 0, total: q.length}; }
function viewReview(){
  rollDay();
  const rs = reviewStats();
  if (!ui.rv) {
    const due = dueCards().length, nw = newCards().length, ready = due + nw;
    let h = '<header class="ph"><span class="eyebrow">Track &middot; <b>Review</b> &middot; ' + state.day.done + ' answered today</span><h1>Daily review</h1><p class="lede">Say each answer out loud before you look. Missed cards come back tomorrow. Known cards come back after longer and longer gaps: 2, 4, 8, 16 days and on.</p></header>';
    h += '<div class="panel pad ready"><span class="big">' + ready + '</span><div class="stack" style="gap:8px"><div><div style="font-weight:600;font-size:1.1rem">' + (ready ? "Cards ready" : "All caught up") + '</div><div class="small lede">' + due + " due, " + nw + " new &middot; about " + Math.max(1, Math.round(ready * 0.35)) + " min</div></div>" +
      (ready ? '<div><button class="btn pri" data-act="rv-start" data-primary="1">Start review <span class="kbd hint-k">Enter</span></button></div>' : '<p class="small lede">Come back tomorrow, or raise new cards per day in <a href="#settings">Settings</a>.</p>') + "</div></div>";
    const boxes = [0, 0, 0, 0]; CARDS.forEach(c => { const r = state.r[c.id]; if (!r) boxes[0]++; else if (r.b <= 1) boxes[1]++; else if (r.b <= 3) boxes[2]++; else boxes[3]++; });
    const names = [["Not started", "c0"], ["Learning &middot; 1&ndash;2 d", "c1"], ["Settling &middot; 4&ndash;8 d", "c2"], ["Holding &middot; 16 d+", "c3"]];
    h += '<section class="sec"><div class="sh"><i>01</i>Deck<span class="aside">' + rs.total + ' cards</span></div><div class="panel pad stack"><div class="deckbar">' + boxes.map((b, i) => b ? '<span class="' + names[i][1] + '" style="flex:' + b + '"></span>' : "").join("") + '</div><div class="deckkey">' + boxes.map((b, i) => '<div><span class="n"><i class="' + names[i][1] + '"></i>' + b + '</span><span class="l">' + names[i][0] + "</span></div>").join("") + '</div></div><p class="small lede">The why-question of every journey step, key numbers and timers, and every term. New cards from chapters you have walked come first.</p></section>';
    const fc = forecast(14), fmax = Math.max(4, ...fc), t = dayNum();
    h += '<section class="sec"><div class="sh"><i>02</i>Forecast<span class="aside">due, next 14 days</span></div><div class="panel pad"><div class="fc">' + fc.map((v, i) => { const dd = dayDate(t + i); return '<div class="b' + (i === 0 ? " t0" : "") + '"><strong>' + (v || "") + '</strong><span style="height:' + (v / fmax * 70) + 'px"></span><em>' + "SMTWTFS"[dd.getUTCDay()] + "</em></div>"; }).join("") + "</div></div></section>";
    return h;
  }
  const v = ui.rv;
  if (!v.queue.length) {
    const b = bler7();
    let h = '<header class="ph"><span class="eyebrow">Review &middot; session closed</span><div class="row" style="gap:18px"><h1>Review done</h1>' + stamp("big pass", "Pass") + '</div><p class="lede">' + v.done + " cards answered, " + v.missed + " missed. Missed cards come back tomorrow." + (b.a >= 10 ? " Your 7-day BLER is " + (b.r * 100).toFixed(1) + "%." : "") + "</p></header>";
    h += '<div class="row"><a class="btn pri" href="#today" data-act="rv-close">Back to Today</a>' + (newCards().length ? '<button class="btn" data-act="rv-start">More new cards</button>' : "") + "</div>";
    return h;
  }
  const it = v.queue[0], c = it.c, isNew = !state.r[c.id];
  const nb = g => { const b = Math.min(INTERVALS.length - 1, (state.r[c.id] ? state.r[c.id].b : 0) + g); return INTERVALS[b]; };
  const doneN = v.done, all = v.done + v.queue.length;
  let h = '<div class="sessbar"><button class="back" data-act="rv-close">&larr; Stop</button><div class="grow">' + meter(doneN / Math.max(1, all)) + '</div><span class="eyebrow num">' + v.queue.length + " left</span></div>";
  h += '<div class="panel flash grid-bg"><div class="tags"><span class="tag">' + esc(c.g) + "</span>" + (isNew ? stamp("next", "New") : "") + (it.again ? stamp("fail", "Again") : "") + "</div>" +
    (c.term ? '<span class="eyebrow">What is it, and where does it matter?</span><div class="prompt mono">' + esc(c.f) + "</div>" : '<div class="prompt">' + esc(c.f) + "</div>") +
    (v.shown ? '<div class="ans">' + esc(c.b) + "</div>" : "") + "</div>";
  if (!v.shown) h += '<button class="btn pri wide" data-act="rv-show" data-primary="1" style="min-height:52px">Show answer <span class="kbd hint-k">Space</span></button>';
  else h += '<div class="grade"><button class="btn fail" data-act="rv-grade" data-v="0" data-key="1">' + kbd(1) + "Missed<small>tomorrow</small></button><button class=\"btn inc\" data-act=\"rv-grade\" data-v=\"1\" data-key=\"2\">" + kbd(2) + "With effort<small>" + (it.again ? "tomorrow" : nb(1) + " days") + '</small></button><button class="btn pass" data-act="rv-grade" data-v="2" data-key="3">' + kbd(3) + "Easy<small>" + (it.again ? "tomorrow" : nb(2) + " days") + "</small></button></div>";
  return h;
}

/* ---------- Library ---------- */
function termList(){ const q = ui.lib.termQ.trim().toLowerCase(), cat = ui.lib.cat; return TERMS.filter(t => (!cat || t[1] === cat) && (!q || t[0].toLowerCase().includes(q) || t[2].toLowerCase().includes(q))); }
function termGrid(){ const list = termList(), q = ui.lib.termQ.trim(); return list.length ? '<div class="terms">' + list.map(t => '<div class="term"><div class="row"><span class="t">' + hlq(t[0], q) + '</span><span class="tag">' + TERM_CATS[t[1]] + '</span></div><div class="m">' + hlq(t[2], q) + "</div></div>").join("") + "</div>" : '<div class="note quiet"><span class="k">No match</span>No terms match &ldquo;' + esc(q) + "&rdquo;. Try <kbd class=\"kbd\">/</kbd> to search lessons and steps too.</div>"; }
function viewLibrary(sub, open){
  const terms = sub === "terms";
  if (sub && !terms && LEARN.some(m => m.id === sub)) { ui.lib.mod = sub; if (open) ui.lib.open.add(open); }
  const read = ALL_LESSONS.filter(l => state.lessons[l.id]).length;
  let h = '<header class="ph"><span class="eyebrow">Track &middot; <b>Library</b> &middot; ' + read + " / " + ALL_LESSONS.length + ' read</span><h1>Library</h1><p class="lede">Reference for when a step or a card does not make sense yet. Reading is for understanding; the other tabs are for remembering.</p></header>';
  h += '<div class="row"><div class="seg" role="group" aria-label="Library section"><a href="#library" style="display:contents"><button aria-pressed="' + !terms + '" tabindex="-1">Lessons &middot; ' + ALL_LESSONS.length + '</button></a><a href="#library/terms" style="display:contents"><button aria-pressed="' + terms + '" tabindex="-1">Terms &middot; ' + TERMS.length + "</button></a></div></div>";
  if (terms) {
    const cats = Object.keys(TERM_CATS);
    return h + '<div class="searchbox">' + SVG.search + '<input class="field" id="termQ" type="search" placeholder="Filter ' + TERMS.length + ' terms" value="' + esc(ui.lib.termQ) + '" data-in="termQ" autocomplete="off"></div>' +
      '<div class="chips scroll"><button class="chip" data-act="tcat" data-id="" aria-pressed="' + !ui.lib.cat + '">All</button>' + cats.map(k => '<button class="chip" data-act="tcat" data-id="' + k + '" aria-pressed="' + (ui.lib.cat === k) + '">' + TERM_CATS[k] + ' <span class="c">' + TERMS.filter(t => t[1] === k).length + "</span></button>").join("") + '</div><div id="termGrid">' + termGrid() + "</div>";
  }
  const mod = LEARN.find(m => m.id === ui.lib.mod) || LEARN[0];
  const modBtn = (m, cls) => { const d = m.lessons.filter(l => state.lessons[l.id]).length; return cls === "chip" ? '<button class="chip" data-act="mod" data-id="' + m.id + '" aria-pressed="' + (m.id === mod.id) + '">' + esc(m.t) + ' <span class="c">' + d + "/" + m.lessons.length + "</span></button>"
    : '<button class="mod" data-act="mod" data-id="' + m.id + '" aria-pressed="' + (m.id === mod.id) + '"><span>' + esc(m.t) + '</span><span class="c">' + d + "/" + m.lessons.length + "</span>" + meter(d / m.lessons.length, d === m.lessons.length ? "pass" : "") + "</button>"; };
  h += '<div class="libgrid"><nav class="mods" aria-label="Modules">' + LEARN.map(m => modBtn(m, "mod")).join("") + '</nav><div class="stack" style="gap:16px;min-width:0"><div class="chips scroll">' + LEARN.map(m => modBtn(m, "chip")).join("") + "</div>";
  h += '<div class="stack" style="gap:6px"><span class="eyebrow">Module ' + pad2(LEARN.indexOf(mod) + 1) + " / " + pad2(LEARN.length) + '</span><h2 class="qtitle">' + esc(mod.t) + '</h2><p class="lede">' + esc(mod.s) + '</p></div><div class="panel">';
  mod.lessons.forEach(l => { const on = !!state.lessons[l.id];
    h += '<details class="dis" data-id="' + l.id + '"' + (ui.lib.open.has(l.id) ? " open" : "") + "><summary>" + tick(on) + '<span class="ttl">' + esc(l.t) + '</span></summary><div class="body"><ul>' + l.p.map(x => "<li>" + x + "</li>").join("") + "</ul>" +
      (l.say ? '<div class="note pass"><span class="k">Say it in one breath</span><span class="say">' + l.say + "</span></div>" : "") + (l.trap ? '<div class="note inc"><span class="k">Watch out</span>' + l.trap + "</div>" : "") +
      '<div><button class="btn sm' + (on ? " on" : "") + '" data-act="lesson" data-id="' + l.id + '">' + (on ? "&#10003; Read &middot; tap to undo" : "Mark as read") + "</button></div></div></details>"; });
  return h + "</div></div></div>";
}

/* ---------- Settings ---------- */
function viewSettings(){
  const th = state.set.theme || "auto";
  let h = '<header class="ph"><span class="eyebrow">Bench &middot; <b>Settings</b></span><h1>Settings &amp; backup</h1><p class="lede">Your progress lives only in this browser on this device. Export a backup now and then.</p></header>';
  h += '<section class="sec"><div class="sh"><i>01</i>Practice</div><div class="panel">' +
    '<div class="setrow"><div><div class="t">New review cards per day</div><div class="s">Watch your BLER on Today. Under 5%: raise this. Over 15%: lower it.</div></div><div class="seg">' + [5, 10, 15, 20, 30].map(n => '<button data-act="npd" data-v="' + n + '" aria-pressed="' + (state.set.newPerDay === n) + '">' + n + "</button>").join("") + "</div></div>" +
    '<div class="setrow"><div><div class="t">Theme</div><div class="s">Auto follows your system setting.</div></div><div class="seg">' + [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]].map(x => '<button data-act="theme" data-id="' + x[0] + '" aria-pressed="' + (th === x[0]) + '">' + x[1] + "</button>").join("") + "</div></div></div></section>";
  h += '<section class="sec"><div class="sh"><i>02</i>Install</div><div class="panel"><div class="setrow"><div><div class="t">Add to your home screen</div><div class="s">iPhone or iPad: open in Safari, tap Share, then &ldquo;Add to Home Screen&rdquo;. Android or desktop Chrome: &ldquo;Install app&rdquo; in the browser menu. After the first visit it works offline.</div></div>' + (ui.installEvt ? '<button class="btn pri" data-act="install">Install app</button>' : "") + "</div></div></section>";
  h += '<section class="sec"><div class="sh"><i>03</i>Backup</div><div class="panel">' +
    '<div class="setrow"><div><div class="t">Export or import</div><div class="s">A JSON file with everything: review schedule, passes, cases, lessons, activity.</div></div><div class="row"><button class="btn" data-act="export">Export backup</button><label class="btn" for="importFile">Import</label><input type="file" id="importFile" accept="application/json,.json" hidden></div></div>' +
    '<div class="setrow"><div><div class="t">Clear my progress</div><div class="s">Cannot be undone. Export first.</div></div><div class="row">' + (ui.shown.has("reset") ? '<button class="btn fail" data-act="reset-yes">Yes, clear everything</button><button class="btn" data-act="reset-no">Keep it</button>' : '<button class="btn sm" data-act="reset-ask">Clear progress</button>') + "</div></div></div></section>";
  h += '<section class="sec"><div class="sh"><i>04</i>Keyboard</div><div class="panel pad keys">' + [["/", "Search everything (also Ctrl or Cmd + K)"], ["T J C R L", "Go to Today, Journey, Cases, Review, Library"], ["1 &ndash; 9", "Pick an option or grade a card"], ["Space", "Show the answer"], ["Enter", "Continue"], ["Esc", "Close search, stop review"]].map(k => '<span class="mono small" style="white-space:nowrap">' + k[0].split(" ").map(x => x === "&ndash;" ? x : '<span class="kbd">' + x + "</span>").join(" ") + "</span><span>" + k[1] + "</span>").join("") + "</div></section>";
  h += '<section class="sec"><div class="sh"><i>05</i>About the content</div><div class="panel pad stack small"><p><b>Log lines are simplified.</b> They were written for teaching and are not output from any real tool.</p><p><b>Check details before you rely on them.</b> Timer values, cause numbers and spec references were written from general knowledge of the 3GPP standards. Verify against the specifications for anything that matters.</p><p><b>The satellite chapter is reasoning.</b> It works from physics and public information, not from any vendor&rsquo;s design.</p></div></section>';
  return h;
}

/* ---------- search palette ---------- */
let INDEX = null;
function buildIndex(){
  INDEX = [];
  LEARN.forEach(m => m.lessons.forEach(l => INDEX.push({g: "Lessons", t: l.t, s: m.t + " &middot; " + esc(stripTags(l.say || l.p[0])), x: (l.t + " " + stripTags(l.p.join(" ")) + " " + stripTags(l.say || "")).toLowerCase(), href: "#library/" + m.id + "/" + l.id})));
  JOURNEY.forEach((ch, ci) => ch.steps.forEach((st, k) => INDEX.push({g: "Journey steps", t: st.m, mono: true, s: "Ch " + pad2(ci + 1) + " &middot; " + esc(ch.t) + " &middot; " + esc(st.l) + " &middot; " + esc(st.d), x: (st.m + " " + st.l + " " + st.d + " " + st.q + " " + st.a + " " + st.log).toLowerCase(), href: "#journey/" + ch.id})));
  CASES.forEach(c => INDEX.push({g: "Cases", t: caseId(c) + " · " + c.t, s: esc(c.tag) + " &middot; " + esc(c.brief), x: (c.t + " " + c.tag + " " + c.brief + " " + c.setup + " " + c.log.join(" ")).toLowerCase(), href: "#cases/" + c.id}));
  TERMS.forEach(t => INDEX.push({g: "Terms", t: t[0], mono: true, s: esc(t[2]), x: (t[0] + " " + t[2]).toLowerCase(), term: t[0], href: "#library/terms"}));
  FACTS.forEach(f => INDEX.push({g: "Facts", t: f[0], s: esc(f[1]), x: (f[0] + " " + f[1]).toLowerCase(), fact: true}));
}
const pal = {open: false, q: "", sel: 0, res: [], exp: -1, last: null};
function searchIndex(q){
  if (!INDEX) buildIndex();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const out = [];
  INDEX.forEach(it => { if (!words.every(w => it.x.includes(w))) return; const tl = it.t.toLowerCase(); let sc = 0; words.forEach(w => { if (tl.startsWith(w)) sc += 6; else if (tl.includes(w)) sc += 3; }); if (tl === q.toLowerCase()) sc += 10; out.push({it, sc}); });
  const gOrder = ["Terms", "Lessons", "Journey steps", "Cases", "Facts"];
  out.sort((a, b) => b.sc - a.sc);
  const top = out.slice(0, 60);
  top.sort((a, b) => gOrder.indexOf(a.it.g) - gOrder.indexOf(b.it.g) || b.sc - a.sc);
  return top.map(x => x.it);
}
function openPalette(){
  pal.open = true; pal.q = ""; pal.sel = 0; pal.exp = -1; pal.last = document.activeElement;
  const el = $("#palette"); el.hidden = false;
  el.innerHTML = '<div class="pal-bg" data-act="pal-close"><div class="pal" role="dialog" aria-modal="true" aria-label="Search" data-act="pal-noop"><div class="in">' + SVG.search + '<input id="palInput" type="text" placeholder="Search terms, lessons, steps, cases, facts" autocomplete="off" spellcheck="false" aria-controls="palRes"><span class="kbd">Esc</span></div><div class="res" id="palRes" role="listbox"></div><div class="ft"><span><span class="kbd">&uarr;</span><span class="kbd">&darr;</span> move</span><span><span class="kbd">Enter</span> open</span><span><span class="kbd">Esc</span> close</span></div></div></div>';
  renderPalRes(); $("#palInput").focus();
}
function closePalette(){ pal.open = false; const el = $("#palette"); el.hidden = true; el.innerHTML = ""; if (pal.last && pal.last.focus) try { pal.last.focus(); } catch (e) {} }
function renderPalRes(){
  const box = $("#palRes"); if (!box) return;
  pal.res = searchIndex(pal.q);
  if (!pal.q.trim()) { box.innerHTML = '<div class="empty">Type to search ' + (TERMS.length + ALL_LESSONS.length + CARDS.filter(c => c.ch).length + CASES.length + FACTS.length) + " items. Try <span class=\"mono\">T310</span>, <span class=\"mono\">HARQ</span> or <span class=\"mono\">handover</span>.</div>"; return; }
  if (!pal.res.length) { box.innerHTML = '<div class="empty">Nothing matches &ldquo;' + esc(pal.q) + "&rdquo;.</div>"; return; }
  let g = "", h = "";
  pal.res.forEach((it, i) => { if (it.g !== g) { g = it.g; h += '<div class="grp">' + g + "</div>"; }
    h += '<a class="it" role="option" id="pal-' + i + '" href="' + (it.href || "#") + '" data-act="pal-go" data-v="' + i + '" aria-selected="' + (i === pal.sel) + '"><span class="t' + (it.mono ? " mono" : "") + '">' + hlq(it.t, pal.q) + '</span><span class="s"' + (i === pal.exp ? ' style="-webkit-line-clamp:unset"' : "") + ">" + it.s + "</span></a>"; });
  box.innerHTML = h;
  const sel = $("#pal-" + pal.sel); if (sel) sel.scrollIntoView({block: "nearest"});
}
function palGo(i){
  const it = pal.res[i]; if (!it) return;
  if (it.fact) { pal.exp = pal.exp === i ? -1 : i; pal.sel = i; renderPalRes(); return; }
  if (it.term) { ui.lib.termQ = it.term; ui.lib.cat = ""; }
  closePalette();
  if (location.hash === it.href) go(); else location.hash = it.href;
}

/* ---------- events ---------- */
document.addEventListener("toggle", e => { const d = e.target; if (d && d.matches && d.matches("details[data-id]")) { if (d.open) ui.lib.open.add(d.dataset.id); else ui.lib.open.delete(d.dataset.id); } }, true);
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const act = b.dataset.act, v = b.dataset.v === undefined ? null : +b.dataset.v, r = ui.route;
  const ch = r[0] === "journey" ? JOURNEY.find(c => c.id === r[1]) : null, cs = r[0] === "cases" ? CASES.find(c => c.id === r[1]) : null, j = ui.j, u = ui.c, rv = ui.rv;
  let top = false;
  switch (act) {
    case "search": openPalette(); return;
    case "pal-close": closePalette(); return;
    case "pal-noop": return;
    case "pal-go": e.preventDefault(); palGo(v); return;
    case "timer-start": startTimer(v); break;
    case "timer-stop": stopTimer(); break;
    case "install": if (ui.installEvt) { ui.installEvt.prompt(); ui.installEvt = null; } break;
    case "export": exportBackup(); return;
    case "reset-ask": ui.shown.add("reset"); break;
    case "reset-no": ui.shown.delete("reset"); break;
    case "reset-yes": state = blank(); ui.shown.delete("reset"); ui.j = ui.c = ui.rv = null; applyTheme(); save(); toast("Progress cleared"); break;
    case "npd": state.set.newPerDay = v; save(); break;
    case "theme": state.set.theme = b.dataset.id; applyTheme(); save(); break;
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
    case "p3-ex": { const card = CARD_BY_ID["jq-" + ch.id + "-" + j.ex[j.exAt]]; if (v) j.exGot++; else if (card) state.r[card.id] = Object.assign({}, state.r[card.id], {b: 0, due: dayNum(), n: ((state.r[card.id] || {}).n || 0) + 1}); j.exAt++; j.exShown = false; if (j.exAt >= j.ex.length) { j.stage = "done"; finishPass(ch, 3, j.mistakes <= 2); } else save(); top = true; break; }
    case "case-pick": if (u.pick !== null) return; u.pick = v; u.picks[u.i] = v; u.score += cs.nodes[u.i].o[v][1]; break;
    case "case-cause": if (u.causePick !== null) return; u.causePick = v; if (v === cs.cause.a) u.score += 2; break;
    case "case-next": if (u.stage === "nodes") { u.pick = null; if (u.i + 1 < cs.nodes.length) u.i++; else u.stage = "cause"; } else { u.stage = "done"; rollDay(); const max = cs.nodes.length * 2 + 2, s = state.c[cs.id] || {best: 0, n: 0}; s.best = Math.max(s.best, u.score / max); s.n++; state.c[cs.id] = s; state.day.cs = 1; bump(2); markActive(); save(); } break;
    case "case-bug": u.bugShown = true; { const ta = $("#bugTitle"); u.bugText = ta ? ta.value : ""; } break;
    case "case-restart": startCase(cs); top = true; break;
    case "ctag": ui.caseTag = b.dataset.id; break;
    case "logwrap": ui.logWrap = !ui.logWrap; break;
    case "logmark": if (u.marks.has(v)) u.marks.delete(v); else u.marks.add(v); b.classList.toggle("mk"); return;
    case "rv-start": startReview(); top = true; break;
    case "rv-close": ui.rv = null; if (b.tagName === "A") return; top = true; break;
    case "rv-show": rv.shown = true; break;
    case "rv-grade": { const it = rv.queue.shift(); grade(it.c, v, it.again); rv.done++; if (v === 0) { rv.missed++; rv.queue.push({c: it.c, again: true}); } rv.shown = false; top = true; break; }
    case "mod": ui.lib.mod = b.dataset.id; if (r[1] && r[1] !== "terms") { history.replaceState(null, "", "#library"); ui.route = ["library"]; } break;
    case "tcat": ui.lib.cat = b.dataset.id; break;
    case "lesson": if (state.lessons[b.dataset.id]) delete state.lessons[b.dataset.id]; else { state.lessons[b.dataset.id] = 1; bump(2); } save(); break;
    default: return;
  }
  if (top) { render(); window.scrollTo(0, 0); } else rerender();
  const need = {"p1-why": "[data-act=p1-next]", "p1-pick": "[data-act=p1-why]", "rv-show": ".grade", "case-pick": "[data-act=case-next]", "case-cause": "[data-act=case-next]", "p3-show": "[data-act=p3-ex]", "p2-pick": "[data-act=p2-next]"}[act];
  if (need) { const el = $(need); if (el && el.scrollIntoView) el.scrollIntoView({block: "nearest", behavior: "smooth"}); }
  if (act === "case-bug" && u.bugText) { const ta = $("#bugTitle"); if (ta) ta.value = u.bugText; }
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.id === "importFile" && t.files && t.files[0]) { const fr = new FileReader(); fr.onload = () => { try { const d = JSON.parse(fr.result); if (!d || d.v !== 1 || typeof d.r !== "object") throw new Error("bad"); state = normalize(d); applyTheme(); save(); ui.j = ui.c = ui.rv = null; rerender(); toast("Backup imported"); } catch (err) { toast("That file is not a backup from this app"); } }; fr.readAsText(t.files[0]); }
});
document.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset.in === "termQ") { ui.lib.termQ = t.value; const g = $("#termGrid"); if (g) g.innerHTML = termGrid(); }
  if (t.id === "palInput") { pal.q = t.value; pal.sel = 0; pal.exp = -1; renderPalRes(); }
});
document.addEventListener("keydown", e => {
  if (pal.open) {
    if (e.key === "Escape") { e.preventDefault(); closePalette(); }
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (pal.res.length) { pal.sel = (pal.sel + (e.key === "ArrowDown" ? 1 : -1) + pal.res.length) % pal.res.length; $$(".pal .it").forEach(a => a.setAttribute("aria-selected", a.dataset.v == pal.sel)); const s = $("#pal-" + pal.sel); if (s) s.scrollIntoView({block: "nearest"}); } }
    else if (e.key === "Enter") { e.preventDefault(); palGo(pal.sel); }
    else if (e.key === "Tab") e.preventDefault();
    return;
  }
  if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openPalette(); return; }
  const tg = e.target, typing = tg && (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA" || tg.tagName === "SELECT" || tg.isContentEditable);
  if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "/") { e.preventDefault(); openPalette(); return; }
  if (/^[1-9]$/.test(e.key)) { const b = document.querySelector('#view [data-key="' + e.key + '"]:not(:disabled)'); if (b) { e.preventDefault(); b.click(); } return; }
  const onBody = !document.activeElement || document.activeElement === document.body || document.activeElement.id === "view";
  if (e.key === " " && onBody) { const b = document.querySelector("#view [data-act=rv-show], #view [data-act=p3-show]"); if (b) { e.preventDefault(); b.click(); return; } }
  if (e.key === "Enter" && onBody) { const b = document.querySelector("#view [data-primary]:not(:disabled)"); if (b) { e.preventDefault(); b.click(); return; } }
  if (e.key === "Escape" && ui.rv && ui.route[0] === "review") { ui.rv = null; render(); return; }
  if (e.shiftKey) return;
  const tab = TABS.find(t => t[2].toLowerCase() === e.key);
  if (tab) { location.hash = "#" + tab[0]; }
});
function exportBackup(){
  const blob = new Blob([JSON.stringify(state, null, 1)], {type: "application/json"}), a = document.createElement("a");
  const d = new Date(); a.href = URL.createObjectURL(blob); a.download = "ran-trainer-backup-" + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + ".json";
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast("Backup file saved");
}
function applyTheme(){ const t = state.set.theme; if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
window.addEventListener("hashchange", go);
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); ui.installEvt = e; if (ui.route[0] === "settings") rerender(); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) renderChrome(); });
if ("serviceWorker" in navigator && location.protocol !== "file:") window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
applyTheme();
go();
})();
